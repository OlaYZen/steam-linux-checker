// settingsModal.js
export class SettingsModal {
  constructor(steamAccountManager) {
    console.log("Initializing SettingsModal...");
    this.steamAccountManager = steamAccountManager;
    this.initialize();
  }

  initialize() {
    console.log("Setting up settings modal...");
    this.settingsBtn = document.getElementById("settings-btn");
    this.settingsModal = document.getElementById("settings-modal");
    this.closeModalBtn = document.querySelector(".close-modal-btn");
    this.showProtondbToggle = document.getElementById("show-protondb-toggle");
    this.alwaysShowLaunchToggle = document.getElementById("always-show-launch-toggle");
    
    console.log("Settings button found:", !!this.settingsBtn);
    console.log("Settings modal found:", !!this.settingsModal);
    console.log("Close button found:", !!this.closeModalBtn);
    console.log("Protondb toggle found:", !!this.showProtondbToggle);
    console.log("Launch toggle found:", !!this.alwaysShowLaunchToggle);
    
    this.setupEventListeners();
    this.initializeSettings();
  }

  setupEventListeners() {
    if (this.settingsBtn) {
      console.log("Adding click listener to settings button");
      this.settingsBtn.addEventListener("click", () => {
        console.log("Settings button clicked");
        this.showSettingsModal();
      });
    } else {
      console.error("Settings button not found!");
    }

    if (this.closeModalBtn) {
      this.closeModalBtn.addEventListener("click", () => this.hideSettingsModal());
    }

    if (this.settingsModal) {
      this.settingsModal.addEventListener("click", (e) => {
        if (e.target === this.settingsModal) this.hideSettingsModal();
      });
    }

    if (this.showProtondbToggle) {
      this.showProtondbToggle.addEventListener("change", () => this.updateSettings());
    }

    if (this.alwaysShowLaunchToggle) {
      this.alwaysShowLaunchToggle.addEventListener("change", () => this.updateSettings());
    }
  }

  showSettingsModal() {
    console.log("Showing settings modal");
    if (!this.settingsModal) {
      console.error("Settings modal not found!");
      return;
    }
    this.settingsModal.style.display = "flex";
    setTimeout(() => this.settingsModal.classList.add("show"), 10);
  }

  hideSettingsModal() {
    if (!this.settingsModal) return;
    this.settingsModal.classList.remove("show");
    setTimeout(() => this.settingsModal.style.display = "none", 300);
  }

  updateSettings() {
    const newConfig = {
      show_protondb_ratings: this.showProtondbToggle.checked,
      always_show_launch_button: this.alwaysShowLaunchToggle.checked
    };
    
    try {
      this.steamAccountManager.configManager.updateConfig(newConfig);
      this.steamAccountManager.toastManager.showSuccess("Settings updated");
    } catch (error) {
      console.error("Error updating settings:", error);
      this.steamAccountManager.toastManager.showError("Failed to update settings");
    }
  }

  initializeSettings() {
    const config = this.steamAccountManager.configManager.getConfig();
    if (this.showProtondbToggle) {
      this.showProtondbToggle.checked = config.show_protondb_ratings;
    }
    if (this.alwaysShowLaunchToggle) {
      this.alwaysShowLaunchToggle.checked = config.always_show_launch_button;
    }
  }
} 