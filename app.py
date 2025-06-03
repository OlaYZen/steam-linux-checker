import requests
import os
import time
import json
import secrets
import urllib.parse
from flask import Flask, render_template, jsonify, request, redirect, url_for, session
from flask_caching import Cache
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__)
app.secret_key = secrets.token_hex(32)

cache = Cache(app, config={"CACHE_TYPE": "SimpleCache"})

STEAM_API_KEY = os.getenv("STEAM_API_KEY")
STEAM_OPENID_URL = "https://steamcommunity.com/openid/login"
STEAM_OPENID_VERIFY_URL = "https://steamcommunity.com/openid/login"

STEAM_OWNED_GAMES_URL = (
    "https://api.steampowered.com/IPlayerService/GetOwnedGames/v1/"
)

PROTONDB_COMMUNITY_API_BASE = (
    "https://protondb-community-api-04f42bc1742f.herokuapp.com/api/games"
)

STEAM_ACTIVE_PLAYERS_URL = (
    "https://api.steampowered.com/ISteamUserStats/GetNumberOfCurrentPlayers/v1/"
)

STEAM_PLAYER_SUMMARIES_URL = (
    "https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v2/"
)


def get_steam_login_url():
    """Generate Steam OpenID login URL"""
    params = {
        "openid.ns": "http://specs.openid.net/auth/2.0",
        "openid.mode": "checkid_setup",
        "openid.return_to": url_for("steam_callback", _external=True),
        "openid.realm": request.url_root,
        "openid.identity": "http://specs.openid.net/auth/2.0/identifier_select",
        "openid.claimed_id": "http://specs.openid.net/auth/2.0/identifier_select",
    }
    return f"{STEAM_OPENID_URL}?{urllib.parse.urlencode(params)}"


def verify_steam_openid(args):
    """Verify Steam OpenID response"""
    # Convert args to dict and modify for verification
    params = dict(args)
    params["openid.mode"] = "check_authentication"

    try:
        response = requests.post(
            STEAM_OPENID_VERIFY_URL, data=params, timeout=10
        )
        if "is_valid:true" in response.text:
            # Extract Steam ID from identity URL
            identity = params.get("openid.identity", "")
            steam_id = identity.split("/")[-1]
            return steam_id if steam_id.isdigit() else None
    except Exception as e:
        print(f"Steam verification error: {e}")

    return None


@cache.memoize(timeout=3600)
def get_steam_user_info(steam_id):
    """Get Steam user information"""
    params = {
        "key": STEAM_API_KEY,
        "steamids": steam_id,
    }
    try:
        response = requests.get(
            STEAM_PLAYER_SUMMARIES_URL, params=params, timeout=10
        )
        response.raise_for_status()
        data = response.json()
        players = data.get("response", {}).get("players", [])
        if players:
            player = players[0]
            return {
                "steamid": player["steamid"],
                "personaname": player.get("personaname", "Unknown"),
                "avatar": player.get("avatarfull", ""),
                "profileurl": player.get("profileurl", ""),
            }
    except Exception as e:
        print(f"Error fetching user info: {e}")

    return None


@cache.memoize(timeout=3600)
def get_user_owned_games(steam_id):
    """Get games owned by a specific Steam user"""
    params = {
        "key": STEAM_API_KEY,
        "steamid": steam_id,
        "include_appinfo": True,
        "include_played_free_games": True,
    }
    try:
        response = requests.get(
            STEAM_OWNED_GAMES_URL, params=params, timeout=10
        )
        response.raise_for_status()
        data = response.json()
        games = data.get("response", {}).get("games", [])
        return games
    except Exception as e:
        print(f"Error fetching games for {steam_id}: {e}")
        return []


@cache.memoize(timeout=3600)
def get_protondb_tier(appid):
    url = f"{PROTONDB_COMMUNITY_API_BASE}/{appid}/summary"
    try:
        response = requests.get(url, timeout=10)
        response.raise_for_status()
        data = response.json()
        return data.get("tier", "unknown")
    except Exception:
        return "unknown"


@cache.memoize(timeout=3600)
def get_active_players(appid):
    params = {"appid": appid}
    try:
        response = requests.get(
            STEAM_ACTIVE_PLAYERS_URL, params=params, timeout=10
        )
        response.raise_for_status()
        data = response.json()
        return data.get("response", {}).get("player_count", 0)
    except Exception:
        return 0


@app.route("/")
def index():
    return render_template("index.html")


@app.route("/steam/login")
def steam_login():
    """Redirect to Steam OpenID login"""
    return redirect(get_steam_login_url())


@app.route("/steam/refresh/<steam_id>")
def steam_refresh_redirect(steam_id):
    """Redirect to Steam login for account refresh"""
    # Store the steam_id in session to identify this as a refresh
    session["refresh_steam_id"] = steam_id
    return redirect(get_steam_login_url())


@app.route("/steam/callback")
def steam_callback():
    """Handle Steam OpenID callback"""
    steam_id = verify_steam_openid(request.args)

    if not steam_id:
        return redirect(url_for("index", error="steam_auth_failed"))

    # Get user info
    user_info = get_steam_user_info(steam_id)
    if not user_info:
        return redirect(url_for("index", error="steam_user_fetch_failed"))

    # Get user's games
    games = get_user_owned_games(steam_id)

    # Check if this is a refresh operation
    refresh_steam_id = session.pop("refresh_steam_id", None)
    is_refresh = refresh_steam_id == steam_id

    # Prepare response data
    response_data = {
        "user": user_info,
        "games": games,
        "timestamp": int(time.time()),
        "is_refresh": is_refresh,
    }

    # Redirect back to main page with success flag
    return render_template("steam_callback.html", data=json.dumps(response_data))


@app.route("/api/games/<steam_ids>")
def get_games_for_users(steam_ids):
    """Get combined games for multiple Steam users"""
    steam_id_list = [sid.strip() for sid in steam_ids.split(",") if sid.strip()]

    if not steam_id_list:
        return jsonify({"error": "No valid Steam IDs provided"}), 400

    merged_games = {}
    user_info = {}

    # Get user info for all users
    for steam_id in steam_id_list:
        user_data = get_steam_user_info(steam_id)
        if user_data:
            user_info[steam_id] = user_data

    # Get games for all users
    for steam_id in steam_id_list:
        games = get_user_owned_games(steam_id)
        user_name = user_info.get(steam_id, {}).get("personaname", steam_id)

        for game in games:
            appid = game["appid"]
            name = game.get("name", "Unknown")
            playtime = game.get("playtime_forever", 0)

            if appid not in merged_games:
                merged_games[appid] = {
                    "appid": appid,
                    "name": name,
                    "playtime_forever": playtime,
                    "accounts": [{"id": steam_id, "name": user_name, "playtime_forever": playtime}],
                }
            else:
                merged_games[appid]["playtime_forever"] += playtime
                # Avoid duplicate accounts
                if not any(
                    acc["id"] == steam_id
                    for acc in merged_games[appid]["accounts"]
                ):
                    merged_games[appid]["accounts"].append(
                        {"id": steam_id, "name": user_name, "playtime_forever": playtime}
                    )

    # Sort accounts by name for consistency
    for game in merged_games.values():
        game["accounts"].sort(key=lambda a: a["name"].lower())

    return jsonify({"games": list(merged_games.values()), "users": user_info})


@app.route("/compatibility/<int:appid>")
def compatibility(appid):
    tier = get_protondb_tier(appid)
    active_players = get_active_players(appid)
    return jsonify({
        "appid": appid,
        "compatibility": tier,
        "active_players": active_players,
    })


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)
