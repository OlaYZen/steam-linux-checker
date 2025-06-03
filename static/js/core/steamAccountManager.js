// steamAccountManager.js
import { ToastManager, compatOrder } from "../ui/toastManager.js";
import { SearchManager } from "./searchManager.js";

export class SteamAccountManager {
  constructor(configManager, localStorageManager, toastManager, compatibilityManager, loadingState) {
    console.log("Initializing SteamAccountManager...");
    this.configManager = configManager;
    this.localStorageManager = localStorageManager;
    this.toastManager = toastManager;
    this.compatibilityManager = compatibilityManager;
    this.loadingState = loadingState;
    
    this.accounts = this.localStorageManager.getAccounts();
    console.log("Loaded accounts:", this.accounts);
    
    this.currentGames = [];
    this.filteredGames = [];
    this.sortCriteria = "playtime";
    this.sortAscending = true;
    
    this.searchManager = new SearchManager(this);
    this.init();
    this.initImageCache();
  }

  async initImageCache() {
    if ('caches' in window) {
      try {
        this.imageCache = await caches.open('steam-game-images');
        console.log('Image cache initialized');
      } catch (error) {
        console.error('Failed to initialize image cache:', error);
      }
    }
  }

  async cacheGameImage(appid, imageUrl) {
    if (!this.imageCache) return;

    try {
      const response = await fetch(imageUrl);
      if (response.ok) {
        await this.imageCache.put(imageUrl, response.clone());
      }
    } catch (error) {
      console.error(`Failed to cache image for game ${appid}:`, error);
    }
  }

  async getCachedImage(appid) {
    if (!this.imageCache) return null;

    const imageUrl = `https://cdn.cloudflare.steamstatic.com/steam/apps/${appid}/header.jpg`;
    try {
      const response = await this.imageCache.match(imageUrl);
      return response ? response.url : null;
    } catch (error) {
      console.error(`Failed to get cached image for game ${appid}:`, error);
      return null;
    }
  }

  async preloadGameImages(games) {
    if (!this.imageCache) return;

    // Only preload images for games that are currently visible
    const visibleGames = games.slice(0, 12); // Preload first 12 games initially
    const imagePromises = visibleGames.map(game => {
      const imageUrl = `https://cdn.cloudflare.steamstatic.com/steam/apps/${game.appid}/header.jpg`;
      return this.cacheGameImage(game.appid, imageUrl);
    });

    try {
      await Promise.allSettled(imagePromises);
      console.log('Finished preloading initial game images');

      // Preload remaining images in chunks to avoid overwhelming the browser
      const remainingGames = games.slice(12);
      const chunkSize = 6;
      for (let i = 0; i < remainingGames.length; i += chunkSize) {
        const chunk = remainingGames.slice(i, i + chunkSize);
        await Promise.allSettled(
          chunk.map(game => {
            const imageUrl = `https://cdn.cloudflare.steamstatic.com/steam/apps/${game.appid}/header.jpg`;
            return this.cacheGameImage(game.appid, imageUrl);
          })
        );
        // Small delay between chunks to prevent UI blocking
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    } catch (error) {
      console.error('Error preloading game images:', error);
    }
  }

  init() {
    this.setupEventListeners();
    this.updateUI();
  }

  setupEventListeners() {
    // Steam login button
    const steamLoginBtn = document.getElementById("steam-login-btn");
    if (steamLoginBtn) {
      steamLoginBtn.addEventListener("click", () => {
        this.toastManager.showInfo("Redirecting to Steam...");
        setTimeout(() => {
          window.location.href = "/steam/login";
        }, 300);
      });
    }

    // Add account button
    const addAccountBtn = document.getElementById("add-account-btn");
    if (addAccountBtn) {
      addAccountBtn.addEventListener("click", () => {
        this.toastManager.showInfo("Redirecting to Steam...");
        setTimeout(() => {
          window.location.href = "/steam/login";
        }, 300);
      });
    }

    // Retry button
    const retryBtn = document.getElementById("retry-btn");
    if (retryBtn) {
      retryBtn.addEventListener("click", () => {
        this.loadGames();
      });
    }
  }

  updateUI() {
    const noAccountsDiv = document.getElementById("no-accounts");
    const accountsListDiv = document.getElementById("accounts-list");
    const sortControls = document.getElementById("sort-controls");
    const searchControls = document.getElementById("search-controls");
    const gamesListDiv = document.getElementById("games-list");

    console.log("Updating UI with accounts:", this.accounts);

    if (this.accounts.length === 0) {
      noAccountsDiv.style.display = "block";
      accountsListDiv.style.display = "none";
      sortControls.style.display = "none";
      searchControls.style.display = "none";
      gamesListDiv.innerHTML = "";
    } else {
      noAccountsDiv.style.display = "none";
      accountsListDiv.style.display = "block";
      sortControls.style.display = "block";
      searchControls.style.display = "block";
      
      // Show skeleton loading for accounts
      this.showAccountSkeletons();
      this.renderAccountsList();
      
      // Show skeleton loading for games
      this.showGameSkeletons();
      this.loadGames();
    }
  }

  showAccountSkeletons() {
    const container = document.getElementById("connected-accounts");
    container.innerHTML = this.accounts.map(() => `
      <div class="account-card">
        <div class="skeleton skeleton-avatar"></div>
        <div class="account-info">
          <div class="skeleton skeleton-text medium"></div>
          <div class="skeleton skeleton-text small"></div>
        </div>
        <div class="account-actions">
          <div class="skeleton" style="width: 32px; height: 32px;"></div>
          <div class="skeleton" style="width: 32px; height: 32px;"></div>
        </div>
      </div>
    `).join("");
  }

  showGameSkeletons() {
    const container = document.getElementById("games-list");
    container.innerHTML = Array(6).fill().map(() => `
      <div class="game-card">
        <div class="skeleton skeleton-game-image"></div>
        <div class="game-info">
          <div class="skeleton skeleton-text large"></div>
          <div class="skeleton skeleton-compatibility"></div>
          <div class="info-row-container">
            <div class="skeleton skeleton-info-row"></div>
            <div class="skeleton skeleton-info-row"></div>
          </div>
        </div>
      </div>
    `).join("");
  }

  renderAccountsList() {
    const container = document.getElementById("connected-accounts");
    container.innerHTML = this.accounts
      .map((account) => {
        const lastUpdated = new Date(account.timestamp || 0).toLocaleDateString();
        const timeAgo = this.getTimeAgo(account.timestamp || 0);
        const steamProfileUrl = `https://steamcommunity.com/profiles/${account.user.steamid}`;

        return `
        <div class="account-card" data-steamid="${account.user.steamid}">
          <a href="${steamProfileUrl}" target="_blank" rel="noopener noreferrer" class="account-profile-link">
            <img src="${account.user.avatar}" alt="${account.user.personaname}" class="account-avatar" onerror="this.onerror=null;this.src='https://placehold.co/48x48/2a475e/c7d5e0?text=User';">
          </a>
          <div class="account-info">
            <a href="${steamProfileUrl}" target="_blank" rel="noopener noreferrer" class="account-name">${account.user.personaname}</a>
            <div class="account-games">${account.games.length} games</div>
          </div>
          <div class="account-actions">
            <button class="refresh-account-btn" data-steamid="${account.user.steamid}" title="Refresh account data via Steam login">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.65 6.35C16.2 4.9 14.21 4 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08c-.82 2.33-3.04 4-5.65 4-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z"/>
              </svg>
              <span class="loading-spinner-small"></span>
            </button>
            <button class="remove-account-btn" data-steamid="${account.user.steamid}" title="Remove account from local storage">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
              </svg>
            </button>
          </div>
        </div>
      `;
      })
      .join("");

    // Add the "Add Another Account" button with wrapped content
    const addAccountBtn = document.getElementById("add-account-btn");
    if (addAccountBtn) {
      addAccountBtn.innerHTML = `
        <span class="button-content">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
          </svg>
          Add Another Account
        </span>
      `;
    }

    // Add refresh account event listeners
    container.querySelectorAll(".refresh-account-btn").forEach((btn) => {
      btn.addEventListener("click", async (e) => {
        e.stopPropagation();
        const steamId = btn.dataset.steamid;
        await this.refreshAccount(steamId);
      });
    });

    // Add remove account event listeners
    container.querySelectorAll(".remove-account-btn").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        const steamId = btn.dataset.steamid;
        const accountName =
          this.accounts.find((acc) => acc.user.steamid === steamId)?.user
            .personaname || "this account";

        if (
          confirm(
            `Remove ${accountName} from your connected accounts?\n\nThis will only remove it from local storage. You can re-add it anytime.`
          )
        ) {
          this.removeAccount(steamId);
          this.toastManager.showSuccess(
            `Removed ${accountName} from connected accounts`
          );
        }
      });
    });
  }

  getTimeAgo(timestamp) {
    if (!timestamp) return "Never";

    const now = Date.now();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return "Just now";
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;

    return new Date(timestamp).toLocaleDateString();
  }

  async loadGames() {
    if (this.accounts.length === 0) return;

    this.loadingState.show();

    try {
      const steamIds = this.accounts
        .map((account) => account.user.steamid)
        .join(",");
      const response = await fetch(`/api/games/${steamIds}`);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      this.currentGames = data.games;
      
      // Preload images after getting game data
      this.preloadGameImages(this.currentGames);
      
      this.renderGames();
      this.loadingState.hide();

      // Show success message
      const totalGames = this.currentGames.length;
      const accountCount = this.accounts.length;
      this.toastManager.showSuccess(
        `Loaded ${totalGames} games from ${accountCount} account${
          accountCount > 1 ? "s" : ""
        }`
      );

      setTimeout(() => {
        if (this.currentGames.length > 0) {
          this.sortGames("playtime");
        }
      }, 1000);
    } catch (error) {
      console.error("Error loading games:", error);
      this.loadingState.showError(
        "Failed to load games. Please check your connection and try again."
      );
      this.toastManager.showError("Failed to load game library");
    }
  }

  renderGames() {
    const container = document.getElementById("games-list");
    const multipleAccounts = this.accounts.length > 1;

    if (this.currentGames.length === 0) {
      container.innerHTML = `
        <div style="grid-column: 1 / -1; text-align: center; padding: 60px 20px;">
          <p style="font-size: 1.2rem; color: var(--text-secondary); margin-bottom: 20px;">
            No games found in your library
          </p>
          <p style="color: var(--text-muted);">
            Make sure your Steam profile is public and try refreshing your account data.
          </p>
        </div>
      `;
      return;
    }

    // Initialize filtered games
    this.filteredGames = [...this.currentGames];

    // Use DocumentFragment for better performance
    const fragment = document.createDocumentFragment();
    const template = document.createElement('template');

    this.currentGames.forEach(game => {
      const imageUrl = `https://cdn.cloudflare.steamstatic.com/steam/apps/${game.appid}/header.jpg`;
      template.innerHTML = `
        <a
          href="https://www.protondb.com/app/${game.appid}"
          target="_blank"
          rel="noopener noreferrer"
          class="game-card"
          data-appid="${game.appid}"
          data-name="${game.name.toLowerCase()}"
          data-playtime="${game.playtime_forever}"
          data-activeplayers="0"
          data-compatibility="unknown"
          title="View ${game.name} on ProtonDB"
        >
          <img
            class="game-image"
            src="${imageUrl}"
            alt="${game.name} cover"
            onerror="this.onerror=null;this.src='https://placehold.co/460x215/2a475e/c7d5e0?text=${encodeURIComponent(game.name)}';"
            loading="lazy"
            data-cache-key="${imageUrl}"
          />
          <div class="game-info">
            <h2 class="game-title" title="${game.name}">${game.name}</h2>
            <span class="compatibility unknown">
              Loading
              <span class="loading-spinner"></span>
            </span>
            <div class="info-row-container">
              <div class="info-row">
                <span>Playtime:</span>
                <span class="playtime-hours" ${game.accounts.length > 1 ? `data-tooltip="${game.accounts.map(acc => `${acc.name}: ${(acc.playtime_forever / 60).toFixed(1)} hrs`).join('\n')}"` : ''}>${(
                  game.playtime_forever / 60
                ).toFixed(1)} hrs</span>
              </div>
              <div class="info-row">
                <span>Active Players:</span>
                <span class="active-count">Loading...</span>
              </div>
            </div>
            ${
              multipleAccounts
                ? `
              <div class="accounts-tag" title="Owned by: ${game.accounts
                .map((acc) => acc.name)
                .join(", ")}">
                Owned by: ${game.accounts.map((acc) => acc.name).join(", ")}
              </div>
            `
                : ""
            }
            <button
              class="launch-btn"
              title="Launch ${game.name} via Steam"
              style="display:none;"
              type="button"
            >
              <svg fill="currentColor" viewBox="0 0 29.896 29.772">
                <path d="M21.287,18.764c-0.005-0.004-0.011-0.01-0.016-0.016c7.692-7.961,9.384-17.333,8.351-18.381C28.376-0.896,19.121,0.939,11.13,8.471c-0.006-0.006-0.014-0.013-0.021-0.021l-0.002-0.002C9.918,7.244,8.151,7.055,6.956,8.256l-6.245,6.27c-1.194,1.2-0.849,2.589,0.77,3.089l0.8,0.244c1.54,0.475,3.695-0.023,4.93-1.109c0.367,1.27,1.22,2.402,2.283,3.48c1.062,1.076,2.18,1.941,3.439,2.326c-1.1,1.221-1.625,3.367-1.172,4.912l0.235,0.801c0.478,1.625,1.863,1.99,3.079,0.811l6.352-6.162c1.217-1.18,1.052-2.945-0.138-4.152L21.287,18.764z M20.195,5.067c1.203-1.187,3.141-1.175,4.327,0.027c1.187,1.203,1.174,3.14-0.029,4.328c-1.202,1.186-3.14,1.173-4.326-0.029C18.979,8.192,18.993,6.253,20.195,5.067z"/>
              </svg>
            </button>
          </div>
        </a>
      `;
      fragment.appendChild(template.content.cloneNode(true));
    });

    // Clear and append all at once
    container.innerHTML = '';
    container.appendChild(fragment);

    // Load compatibility data for each game
    this.compatibilityManager.loadCompatibilityData(document.querySelectorAll(".game-card"));

    // Set up image loading with cache using IntersectionObserver
    const imageObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const img = entry.target;
          const cacheKey = img.dataset.cacheKey;
          if (cacheKey) {
            this.getCachedImage(img.dataset.appid).then(cachedUrl => {
              if (cachedUrl) {
                img.src = cachedUrl;
              }
            });
          }
          imageObserver.unobserve(img);
        }
      });
    }, {
      rootMargin: '50px 0px',
      threshold: 0.1
    });

    container.querySelectorAll('.game-image').forEach(img => {
      imageObserver.observe(img);
    });
  }

  launchGame(appid, gameName, event) {
    event.stopPropagation();
    event.preventDefault();

    // Show toast notification
    this.toastManager.showInfo(`Launching ${gameName}...`);

    try {
      // Use location.href to trigger Steam protocol
      window.location.href = `steam://run/${appid}`;
    } catch (error) {
      console.error("Error launching game:", error);
      this.toastManager.showError(`Failed to launch ${gameName}`);
    }
  }

  sortGames(criteria) {
    const container = document.getElementById("games-list");
    const cards = Array.from(container.children).filter(
      (card) => !card.classList.contains("search-hidden")
    );

    if (cards.length === 0) return;

    cards.sort((a, b) => {
      let comparison = 0;

      if (criteria === "name") {
        comparison = a.dataset.name.localeCompare(b.dataset.name);
      } else if (criteria === "playtime") {
        comparison =
          parseInt(a.dataset.playtime) - parseInt(b.dataset.playtime);
      } else if (criteria === "compatibility") {
        const aCompat = compatOrder[a.dataset.compatibility] || 999;
        const bCompat = compatOrder[b.dataset.compatibility] || 999;
        comparison = aCompat - bCompat;
      } else if (criteria === "popularity") {
        comparison =
          parseInt(a.dataset.activeplayers) - parseInt(b.dataset.activeplayers);
      }

      // For playtime and popularity, we want highest first by default
      if (criteria === "playtime" || criteria === "popularity") {
        return this.sortAscending ? -comparison : comparison;
      }

      // For other criteria, use normal sort direction
      return this.sortAscending ? comparison : -comparison;
    });

    // Clear container and re-append sorted cards, then hidden ones
    const hiddenCards = Array.from(container.children).filter((card) =>
      card.classList.contains("search-hidden")
    );

    container.innerHTML = "";
    cards.forEach((card) => container.appendChild(card));
    hiddenCards.forEach((card) => container.appendChild(card));
  }

  addAccount(accountData) {
    console.log("Adding account:", accountData);

    if (!accountData || !accountData.user || !accountData.user.steamid) {
      console.error("Invalid account data provided to addAccount");
      return false;
    }

    try {
      // First, reload current accounts from localStorage to ensure we have the latest data
      this.accounts = this.localStorageManager.loadAccounts();
      console.log("Current accounts before adding:", this.accounts);

      const existingIndex = this.accounts.findIndex(
        (account) => account.user.steamid === accountData.user.steamid
      );

      if (existingIndex >= 0) {
        console.log("Updating existing account at index:", existingIndex);
        this.accounts[existingIndex] = accountData;
      } else {
        console.log("Adding new account to existing accounts");
        this.accounts.push(accountData);
      }

      console.log("Accounts after adding:", this.accounts);
      this.localStorageManager.saveAccounts(this.accounts);

      // Verify the save worked
      const verifyAccounts = this.localStorageManager.loadAccounts();
      console.log("Verified accounts after save:", verifyAccounts);

      this.updateUI();

      console.log("Account added successfully. Total accounts:", this.accounts.length);
      return true;
    } catch (error) {
      console.error("Error in addAccount:", error);
      return false;
    }
  }

  removeAccount(steamId) {
    this.accounts = this.accounts.filter(
      (account) => account.user.steamid !== steamId
    );
    this.localStorageManager.saveAccounts(this.accounts);
    this.updateUI();
  }

  async refreshAccount(steamId) {
    const accountCard = document.querySelector(`[data-steamid="${steamId}"]`);
    const refreshBtn = accountCard?.querySelector(".refresh-account-btn");
    const accountName =
      this.accounts.find((acc) => acc.user.steamid === steamId)?.user
        .personaname || "account";

    // Show confirmation dialog with detailed explanation
    const confirmed = confirm(
      `Refresh ${accountName}'s game library?\n\n` +
        `This will:\n` +
        `• Redirect you to Steam for re-authentication\n` +
        `• Fetch the latest game library data\n` +
        `• Update compatibility information\n\n` +
        `Continue?`
    );

    if (!confirmed) {
      return;
    }

    // Show loading state
    if (refreshBtn) {
      refreshBtn.classList.add("loading");
      refreshBtn.disabled = true;
    }

    try {
      // Show toast notification
      this.toastManager.showInfo(`Redirecting to Steam for ${accountName}...`);

      // Small delay to show the toast before redirect
      setTimeout(() => {
        // Redirect to Steam login for refresh
        window.location.href = `/steam/refresh/${steamId}`;
      }, 500);
    } catch (error) {
      console.error("Error initiating refresh:", error);
      this.toastManager.showError(`Failed to initiate refresh for ${accountName}`);

      // Reset button state
      if (refreshBtn) {
        refreshBtn.classList.remove("loading");
        refreshBtn.disabled = false;
      }
    }
  }

  showError(message) {
    this.loadingState.showError(message);
  }
}