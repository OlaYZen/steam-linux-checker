// searchManager.js
class SearchManager {
  constructor(steamAccountManager) {
    this.steamAccountManager = steamAccountManager;
    this.searchTerm = "";
    this.gameAcronyms = {};
    this.loadAcronyms();
    this.setupSearchListeners();
  }

  async loadAcronyms() {
    try {
      const response = await fetch('/static/js/gameAcronyms.json');
      if (!response.ok) {
        throw new Error('Failed to load game acronyms');
      }
      this.gameAcronyms = await response.json();
      console.log('Game acronyms loaded successfully');
    } catch (error) {
      console.error('Error loading game acronyms:', error);
      this.gameAcronyms = {}; // Fallback to empty object if loading fails
    }
  }

  setupSearchListeners() {
    const searchInput = document.getElementById("game-search");
    const clearSearchBtn = document.getElementById("clear-search");

    if (!searchInput) return;

    // Search input handler with debouncing
    let searchTimeout;
    searchInput.addEventListener("input", (e) => {
      clearTimeout(searchTimeout);
      searchTimeout = setTimeout(() => {
        this.searchTerm = e.target.value.trim().toLowerCase();
        this.filterGames();
        this.updateSearchUI();
      }, 150); // 150ms debounce
    });

    // Clear search button
    if (clearSearchBtn) {
      clearSearchBtn.addEventListener("click", () => {
        searchInput.value = "";
        this.searchTerm = "";
        this.filterGames();
        this.updateSearchUI();
        searchInput.focus();
        this.steamAccountManager.toastManager.showInfo("Search cleared");
      });
    }

    // Enter key to focus first result
    searchInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        const firstVisibleGame = document.querySelector(
          ".game-card:not(.search-hidden)"
        );
        if (firstVisibleGame) {
          firstVisibleGame.focus();
          firstVisibleGame.scrollIntoView({
            behavior: "smooth",
            block: "center",
          });
        }
      }
    });

    // Escape key to clear search
    searchInput.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        e.preventDefault();
        if (this.searchTerm) {
          searchInput.value = "";
          this.searchTerm = "";
          this.filterGames();
          this.updateSearchUI();
          this.steamAccountManager.toastManager.showInfo("Search cleared");
        }
      }
    });
  }

  filterGames() {
    if (!this.searchTerm) {
      this.steamAccountManager.filteredGames = [...this.steamAccountManager.currentGames];
    } else {
      // Check if the search term matches any acronym
      const expandedTerm = this.gameAcronyms[this.searchTerm.toLowerCase()] || this.searchTerm;
      
      this.steamAccountManager.filteredGames = this.steamAccountManager.currentGames.filter((game) => {
        const gameName = game.name.toLowerCase();
        const accounts = game.accounts
          .map((acc) => acc.name.toLowerCase())
          .join(" ");

        return (
          gameName.includes(expandedTerm) ||
          accounts.includes(expandedTerm)
        );
      });
    }

    this.updateGameVisibility();
  }

  updateGameVisibility() {
    const gameCards = document.querySelectorAll(".game-card");
    const visibleAppIds = new Set(
      this.steamAccountManager.filteredGames.map((game) => game.appid.toString())
    );

    gameCards.forEach((card) => {
      const appId = card.getAttribute("data-appid");
      if (visibleAppIds.has(appId)) {
        card.classList.remove("search-hidden");
        this.highlightSearchTerm(card);
      } else {
        card.classList.add("search-hidden");
      }
    });
  }

  highlightSearchTerm(card) {
    const titleElement = card.querySelector(".game-title");
    if (!titleElement || !this.searchTerm) {
      // Clear any existing highlights
      const originalText = titleElement?.getAttribute("data-original-text");
      if (originalText) {
        titleElement.textContent = originalText;
      }
      return;
    }

    const originalText =
      titleElement.getAttribute("data-original-text") ||
      titleElement.textContent;
    titleElement.setAttribute("data-original-text", originalText);

    if (this.searchTerm.length >= 2) {
      // Get the expanded term if it's an acronym
      const expandedTerm = this.gameAcronyms[this.searchTerm.toLowerCase()] || this.searchTerm;
      
      // Create regex for both the acronym and expanded term
      const searchRegex = new RegExp(
        `(${this.escapeRegex(this.searchTerm)}|${this.escapeRegex(expandedTerm)})`,
        "gi"
      );
      
      const highlightedText = originalText.replace(
        searchRegex,
        '<span class="search-highlight">$1</span>'
      );
      titleElement.innerHTML = highlightedText;
    } else {
      titleElement.textContent = originalText;
    }
  }

  escapeRegex(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }

  updateSearchUI() {
    const searchInput = document.getElementById("game-search");
    const clearSearchBtn = document.getElementById("clear-search");
    const searchStats = document.getElementById("search-stats");

    if (!searchInput) return;

    // Show/hide clear button
    if (clearSearchBtn) {
      clearSearchBtn.style.display = this.searchTerm ? "flex" : "none";
    }

    // Update search stats
    if (searchStats) {
      if (this.searchTerm) {
        searchStats.style.display = "block";
        
        if (this.steamAccountManager.filteredGames.length === 0) {
          let message;
          const isKnownAcronym = this.gameAcronyms[this.searchTerm.toLowerCase()];
          
          if (isKnownAcronym) {
            message = `<strong>${this.gameAcronyms[this.searchTerm.toLowerCase()]}</strong> not found`;
          } else {
            message = `No games found for "<strong>${this.searchTerm}</strong>"`;
            // Add extra message for short search terms that aren't in the acronyms list
            if (this.searchTerm.length <= 5) {
              message += `<br><span class="acronym-help">If this is a game acronym and you'd like to contribute, please visit our <a href="https://github.com/OlaYZen/steam-linux-checker/blob/main/static/js/gameAcronyms.json" target="_blank" rel="noopener noreferrer">GitHub project</a> to add it!</span>`;
            }
          }
          
          searchStats.innerHTML = message;
          searchStats.style.color = "var(--text-muted)";
        } else {
          searchStats.innerHTML = `${this.steamAccountManager.filteredGames.length} games found`;
          searchStats.style.color = "var(--text-secondary)";
        }
      } else {
        searchStats.style.display = "none";
        searchStats.innerHTML = "";
        searchStats.style.color = "";
      }
    }

    // Re-sort the filtered results with current criteria and direction
    if (this.searchTerm) {
      this.steamAccountManager.sortGames(this.steamAccountManager.sortCriteria);
    }
  }
}

export { SearchManager }; 