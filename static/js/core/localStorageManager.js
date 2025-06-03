// localStorageManager.js
export class LocalStorageManager {
  constructor() {
    this.accounts = this.loadAccounts();
  }

  validateAndFixLocalStorage() {
    try {
      const accountsJson = localStorage.getItem("steamAccounts");
      console.log("Raw localStorage data:", accountsJson);

      if (!accountsJson) {
        console.log("No accounts in localStorage, initializing empty array");
        localStorage.setItem("steamAccounts", "[]");
        return [];
      }

      let accounts = JSON.parse(accountsJson);

      if (!Array.isArray(accounts)) {
        console.warn("localStorage data is not an array, resetting");
        localStorage.setItem("steamAccounts", "[]");
        return [];
      }

      // Validate each account has required structure
      accounts = accounts.filter((account) => {
        if (!account || !account.user || !account.user.steamid) {
          console.warn("Removing invalid account:", account);
          return false;
        }

        // Ensure games is an array
        if (!Array.isArray(account.games)) {
          console.warn("Fixing games array for account:", account.user.steamid);
          account.games = [];
        }

        // Ensure timestamp exists
        if (!account.timestamp) {
          account.timestamp = Date.now();
        }

        return true;
      });

      // Save cleaned data back
      localStorage.setItem("steamAccounts", JSON.stringify(accounts));
      console.log("Validated accounts:", accounts);

      return accounts;
    } catch (error) {
      console.error("Error validating localStorage:", error);
      localStorage.setItem("steamAccounts", "[]");
      return [];
    }
  }

  loadAccounts() {
    return this.validateAndFixLocalStorage();
  }

  saveAccounts(accounts) {
    try {
      const accountsJson = JSON.stringify(accounts);
      localStorage.setItem("steamAccounts", accountsJson);
      console.log("Accounts saved to localStorage:", accountsJson);
      return true;
    } catch (e) {
      console.error("Error saving accounts:", e);
      return false;
    }
  }

  getAccounts() {
    return this.accounts;
  }

  setAccounts(accounts) {
    this.accounts = accounts;
    return this.saveAccounts(accounts);
  }
} 