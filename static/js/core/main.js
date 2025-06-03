// main.js
import { ToastManager } from "../ui/toastManager.js";
import { SteamAccountManager } from "./steamAccountManager.js";
import { SettingsModal } from "../ui/settingsModal.js";
import { LoadingState } from "../ui/loadingState.js";
import { SortControls } from "../ui/sortControls.js";
import { StickyHeader } from "../ui/stickyHeader.js";
import { ConfigManager } from "./configManager.js";
import { LocalStorageManager } from "./localStorageManager.js";
import { CompatibilityManager } from "./compatibilityManager.js";

// Declare managers in global scope
let steamAccountManager;
let toastManager;

// Wait for DOM to be ready
document.addEventListener('DOMContentLoaded', () => {
  console.log("DOM fully loaded, initializing components...");

  // Initialize core managers
  const configManager = new ConfigManager();
  const localStorageManager = new LocalStorageManager();
  toastManager = new ToastManager();
  const compatibilityManager = new CompatibilityManager(configManager);

  // Initialize UI components
  const loadingState = new LoadingState();
  const stickyHeader = new StickyHeader();

  // Initialize main manager
  steamAccountManager = new SteamAccountManager(
    configManager,
    localStorageManager,
    toastManager,
    compatibilityManager,
    loadingState
  );

  // Initialize UI controls
  const settingsModal = new SettingsModal(steamAccountManager);
  const sortControls = new SortControls(steamAccountManager);

  // Handle URL parameters
  console.log("Checking for URL parameters...");
  const urlParams = new URLSearchParams(window.location.search);

  if (urlParams.get("error")) {
    const errorMap = {
      steam_auth_failed: "Steam authentication failed. Please try again.",
      steam_user_fetch_failed: "Failed to fetch Steam user data. Please try again.",
      steam_profile_private: "Your Steam profile appears to be private. Please make it public to view your games.",
      steam_api_error: "Steam API is currently unavailable. Please try again later.",
      data_parse_failed: "Error processing Steam data. Please try logging in again.",
      no_data: "No data received from Steam. Please try again.",
      invalid_user_data: "Invalid user data received from Steam. Please try again.",
      save_failed: "Failed to save account data. Please check your browser settings and try again.",
    };
    const errorMessage = errorMap[urlParams.get("error")] || "An error occurred. Please try again.";
    steamAccountManager.showError(errorMessage);
    toastManager.showError(errorMessage);
  }

  // Force reload accounts from localStorage
  setTimeout(() => {
    console.log("Force reloading accounts from localStorage...");
    const previousAccountCount = steamAccountManager.accounts.length;
    steamAccountManager.accounts = steamAccountManager.localStorageManager.getAccounts();
    const newAccountCount = steamAccountManager.accounts.length;

    console.log(`Account count changed from ${previousAccountCount} to ${newAccountCount}`);

    if (newAccountCount !== previousAccountCount) {
      console.log("Account count changed, updating UI...");
      steamAccountManager.updateUI();
    }
  }, 100);

  // Initialize sort direction
  const sortDirectionToggle = document.getElementById("sort-direction-toggle");
  if (sortDirectionToggle) {
    sortDirectionToggle.checked = !steamAccountManager.sortAscending;
  }

  // Initial sort
  setTimeout(() => {
    if (steamAccountManager.currentGames.length > 0) {
      steamAccountManager.sortGames("name");
    }
  }, 1000);

  // Clean URL if needed
  if (urlParams.has("error") || urlParams.has("success")) {
    const cleanUrl = window.location.pathname;
    window.history.replaceState({}, document.title, cleanUrl);
  }
});

// Handle visibility changes
document.addEventListener("visibilitychange", () => {
  if (!document.hidden) {
    console.log("Tab became visible, checking for new accounts...");

    const previousAccountCount = steamAccountManager.accounts.length;
    steamAccountManager.accounts = steamAccountManager.localStorageManager.getAccounts();
    const newAccountCount = steamAccountManager.accounts.length;

    if (newAccountCount !== previousAccountCount) {
      console.log(`Account count changed from ${previousAccountCount} to ${newAccountCount}`);
      steamAccountManager.updateUI();

      if (newAccountCount > previousAccountCount) {
        toastManager.showSuccess("New Steam account detected!");
      }
    }

    if (steamAccountManager.accounts.length > 0) {
      const lastUpdate = Math.max(
        ...steamAccountManager.accounts.map((acc) => acc.timestamp || 0)
      );
      const timeSinceUpdate = Date.now() - lastUpdate;

      if (timeSinceUpdate > 300000) {
        console.log("Data might be stale, consider refreshing");
      }
    }
  }
});

// Handle online/offline status
window.addEventListener("online", () => {
  toastManager.showSuccess("Connection restored");
  if (
    steamAccountManager.accounts.length > 0 &&
    steamAccountManager.currentGames.length === 0
  ) {
    steamAccountManager.loadGames();
  }
});

window.addEventListener("offline", () => {
  toastManager.showError("Connection lost - some features may not work");
});

// Export for debugging (only in development)
if (
  window.location.hostname === "localhost" ||
  window.location.hostname === "127.0.0.1"
) {
  window.steamAccountManager = steamAccountManager;
  window.toastManager = toastManager;
}