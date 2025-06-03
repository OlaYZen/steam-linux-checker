// sortControls.js
export class SortControls {
  constructor(steamAccountManager) {
    this.steamAccountManager = steamAccountManager;
    this.sortSelect = document.getElementById("sort-select");
    this.sortDirectionToggle = document.getElementById("sort-direction-toggle");
    this.sortDirectionText = document.getElementById("sort-direction-text");
    
    this.initialize();
  }

  initialize() {
    this.setupEventListeners();
    this.updateSortDirectionText();
  }

  setupEventListeners() {
    if (this.sortSelect) {
      this.sortSelect.addEventListener("change", (e) => {
        this.steamAccountManager.sortCriteria = e.target.value;
        this.updateSortDirectionText();
        this.steamAccountManager.sortGames(this.steamAccountManager.sortCriteria);
        this.steamAccountManager.toastManager.showSuccess(
          `Games sorted by ${e.target.selectedOptions[0].text}`
        );
      });
    }

    if (this.sortDirectionToggle) {
      this.sortDirectionToggle.addEventListener("change", (e) => {
        this.steamAccountManager.sortAscending = !e.target.checked;
        this.updateSortDirectionText();
        this.steamAccountManager.sortGames(this.steamAccountManager.sortCriteria);

        const direction = this.steamAccountManager.sortAscending ? "ascending" : "descending";
        this.steamAccountManager.toastManager.showSuccess(`Sort direction changed to ${direction}`);
      });
    }
  }

  updateSortDirectionText() {
    if (!this.sortDirectionText) return;

    // Add animation class
    this.sortDirectionText.classList.add("changing");

    setTimeout(() => {
      let text = "";
      switch (this.steamAccountManager.sortCriteria) {
        case "name":
          text = this.steamAccountManager.sortAscending ? "A-Z" : "Z-A";
          break;
        case "playtime":
          text = this.steamAccountManager.sortAscending ? "High" : "Low";
          break;
        case "popularity":
          text = this.steamAccountManager.sortAscending ? "High" : "Low";
          break;
        case "compatibility":
          text = this.steamAccountManager.sortAscending ? "Best" : "Worst";
          break;
        default:
          text = this.steamAccountManager.sortAscending ? "Asc" : "Desc";
      }

      this.sortDirectionText.textContent = text;

      // Remove animation class
      setTimeout(() => {
        this.sortDirectionText.classList.remove("changing");
      }, 150);
    }, 150);
  }
} 