// loadingState.js
export class LoadingState {
  constructor() {
    this.loadingState = document.getElementById("loading-state");
    this.gamesList = document.getElementById("games-list");
    this.errorDisplay = document.getElementById("error-display");
  }

  show() {
    this.loadingState.style.display = "block";
    this.gamesList.style.display = "none";
    this.errorDisplay.style.display = "none";
  }

  hide() {
    this.loadingState.style.display = "none";
    this.gamesList.style.display = "grid";
  }

  showError(message) {
    this.loadingState.style.display = "none";
    this.gamesList.style.display = "none";
    this.errorDisplay.style.display = "block";
    document.querySelector(".error-message").textContent = message;
  }
} 