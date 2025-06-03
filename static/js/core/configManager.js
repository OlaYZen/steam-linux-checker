// configManager.js
export class ConfigManager {
  constructor() {
    this.config = this.loadConfig();
  }

  loadConfig() {
    try {
      const savedConfig = localStorage.getItem('steamCheckerConfig');
      if (savedConfig) {
        return JSON.parse(savedConfig);
      }
      // If no saved config, return default
      return {
        show_protondb_ratings: true,
        always_show_launch_button: false
      };
    } catch (error) {
      console.error('Error loading config:', error);
      return {
        show_protondb_ratings: true,
        always_show_launch_button: false
      };
    }
  }

  updateConfig(newConfig) {
    try {
      this.config = newConfig;
      localStorage.setItem('steamCheckerConfig', JSON.stringify(newConfig));
      return true;
    } catch (error) {
      console.error('Error updating config:', error);
      return false;
    }
  }

  getConfig() {
    return this.config;
  }
} 