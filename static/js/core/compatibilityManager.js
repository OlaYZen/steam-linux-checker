// compatibilityManager.js
export class CompatibilityManager {
  constructor(configManager) {
    this.configManager = configManager;
  }

  async loadCompatibilityData(gameCards) {
    const batchSize = 5;
    const addAccountBtn = document.getElementById("add-account-btn");

    if (addAccountBtn) {
      addAccountBtn.disabled = true;
    }

    try {
      for (let i = 0; i < gameCards.length; i += batchSize) {
        const batch = Array.from(gameCards).slice(i, i + batchSize);

        await Promise.all(
          batch.map(async (card) => {
            const appid = card.getAttribute("data-appid");
            const compatSpan = card.querySelector(".compatibility");
            const activeCountSpan = card.querySelector(".active-count");
            const launchBtn = card.querySelector(".launch-btn");

            try {
              const response = await fetch(`/compatibility/${appid}`);

              if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
              }

              const data = await response.json();
              await this.updateCompatibilityUI(card, data, compatSpan, activeCountSpan, launchBtn);
            } catch (error) {
              console.error(`Error loading compatibility for ${appid}:`, error);
              this.handleCompatibilityError(card, compatSpan, activeCountSpan, launchBtn);
            }
          })
        );

        if (i + batchSize < gameCards.length) {
          await new Promise((resolve) => setTimeout(resolve, 100));
        }
      }
    } finally {
      if (addAccountBtn) {
        addAccountBtn.disabled = false;
      }
    }
  }

  async updateCompatibilityUI(card, data, compatSpan, activeCountSpan, launchBtn) {
    const tier = data.compatibility.toLowerCase();
    const validTiers = ["platinum", "gold", "silver", "bronze", "unknown", "error"];

    // Update compatibility display based on configuration
    if (this.configManager.getConfig().show_protondb_ratings) {
      compatSpan.textContent = tier.charAt(0).toUpperCase() + tier.slice(1);
      if (validTiers.includes(tier) && tier !== "unknown" && tier !== "error") {
        compatSpan.className = "compatibility " + tier;
        card.setAttribute("data-compatibility", tier);
      } else {
        compatSpan.className = "compatibility error";
        card.setAttribute("data-compatibility", "error");
      }
    } else {
      compatSpan.style.display = "none";
    }

    // Update active players
    const activePlayers = parseInt(data.active_players) || 0;
    activeCountSpan.textContent = activePlayers.toLocaleString();
    card.setAttribute("data-activeplayers", activePlayers);

    // Show launch button based on configuration and compatibility
    if (launchBtn) {
      if (this.configManager.getConfig().always_show_launch_button || 
          (validTiers.includes(tier) && tier !== "unknown" && tier !== "error")) {
        launchBtn.style.display = "flex";
      } else {
        launchBtn.style.display = "none";
      }
    }
  }

  handleCompatibilityError(card, compatSpan, activeCountSpan, launchBtn) {
    if (this.configManager.getConfig().show_protondb_ratings) {
      compatSpan.textContent = "Unknown";
      compatSpan.className = "compatibility unknown";
      card.setAttribute("data-compatibility", "unknown");
    } else {
      compatSpan.style.display = "none";
    }
    activeCountSpan.textContent = "N/A";
    card.setAttribute("data-activeplayers", 0);
    if (launchBtn) {
      if (this.configManager.getConfig().always_show_launch_button) {
        launchBtn.style.display = "flex";
      } else {
        launchBtn.style.display = "none";
      }
    }
  }
} 