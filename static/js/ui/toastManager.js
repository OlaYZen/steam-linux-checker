// toastManager.js
const compatOrder = {
    platinum: 1,
    gold: 2,
    silver: 3,
    bronze: 4,
    unknown: 5,
    error: 6,
  };
  
  class ToastManager {
    constructor() {
      this.container = this.createContainer();
      this.activeToasts = new Set();
    }
  
    createContainer() {
      const container = document.createElement("div");
      container.id = "toast-container";
      container.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        z-index: 1000;
        display: flex;
        flex-direction: column;
        gap: 12px;
        pointer-events: none;
      `;
      document.body.appendChild(container);
      return container;
    }
  
    showSuccess(message) {
      this.show(message, "success");
    }
  
    showError(message) {
      this.show(message, "error");
    }
  
    showInfo(message) {
      this.show(message, "info");
    }
  
    show(message, type = "info") {
      const toast = this.createToast(message, type);
      this.container.appendChild(toast);
      this.activeToasts.add(toast);
  
      // Trigger entrance animation
      requestAnimationFrame(() => {
        toast.style.transform = "translateX(0)";
        toast.style.opacity = "1";
      });
  
      // Start the timer
      this.startTimer(toast);
    }
  
    createToast(message, type = "info") {
      const toast = document.createElement("div");
  
      // Get colors based on type
      const typeColors = {
        info: {
            bg: "rgba(40, 42, 167, 0.1)",
            border: "rgba(40, 53, 167, 0.3)",
            icon: "#2839a7",
            iconPath: "M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z",
        },
        success: {
            bg: "rgba(40, 167, 69, 0.1)",
            border: "rgba(40, 167, 69, 0.3)",
            icon: "#28a745",
            iconPath: "M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z",
        },
        error: {
            bg: "rgba(220, 53, 69, 0.1)",
            border: "rgba(220, 53, 69, 0.3)",
            icon: "#dc3545",
            iconPath:
                "M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z",
        },
      };
  
      const colors = typeColors[type] || typeColors.info;
  
      toast.style.cssText = `
        background: linear-gradient(135deg, ${colors.bg} 0%, var(--bg-secondary) 100%);
        backdrop-filter: blur(20px);
        -webkit-backdrop-filter: blur(20px);
        border: 1px solid ${colors.border};
        border-radius: 12px;
        padding: 16px 20px;
        box-shadow: 
          0 8px 32px var(--shadow-primary),
          0 4px 16px var(--shadow-secondary);
        color: var(--text-primary);
        font-family: inherit;
        font-size: 0.9rem;
        font-weight: 500;
        min-width: 280px;
        max-width: 350px;
        transform: translateX(100%);
        opacity: 0;
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        pointer-events: auto;
        cursor: pointer;
        position: relative;
        overflow: hidden;
      `;
  
      const content = document.createElement("div");
      content.style.cssText = `
        display: flex;
        align-items: center;
        gap: 12px;
        margin-bottom: 8px;
      `;
  
      const icon = document.createElement("div");
      icon.innerHTML = `
        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
          <path d="${colors.iconPath}"/>
        </svg>
      `;
      icon.style.cssText = `
        color: ${colors.icon};
        flex-shrink: 0;
      `;
  
      const text = document.createElement("div");
      text.style.cssText = `
        flex: 1;
        line-height: 1.4;
      `;
  
      const title = document.createElement("div");
      title.textContent =
        type === "info" ? "Launching Game" : type === "success" ? "Success" : "Error";
      title.style.cssText = `
        font-weight: 600;
        color: var(--text-bright);
        margin-bottom: 2px;
      `;
  
      const subtitle = document.createElement("div");
      subtitle.textContent = message;
      subtitle.style.cssText = `
        color: var(--text-secondary);
        font-size: 0.85rem;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      `;
  
      text.appendChild(title);
      text.appendChild(subtitle);
      content.appendChild(icon);
      content.appendChild(text);
  
      const progressBar = document.createElement("div");
      progressBar.style.cssText = `
        width: 100%;
        height: 3px;
        background: rgba(199, 213, 224, 0.2);
        border-radius: 2px;
        overflow: hidden;
        position: relative;
      `;
  
      const progressFill = document.createElement("div");
      progressFill.style.cssText = `
        width: 100%;
        height: 100%;
        background: linear-gradient(90deg, ${colors.icon} 0%, ${colors.icon}aa 100%);
        border-radius: 2px;
        transition: width 0.1s linear;
        box-shadow: 0 0 8px ${colors.icon}66;
      `;
  
      progressBar.appendChild(progressFill);
      toast.appendChild(content);
      toast.appendChild(progressBar);
  
      // Store references for timer management
      toast._progressFill = progressFill;
      toast._isHovered = false;
      toast._isPaused = false;
      toast._progress = 100;
      toast._startTime = null;
      toast._pausedTime = 0;
  
      // Add hover events
      toast.addEventListener("mouseenter", () => {
        toast._isHovered = true;
        toast._isPaused = true;
        // Reset progress bar to 100%
        toast._progress = 100;
        toast._progressFill.style.width = "100%";
      });
  
      toast.addEventListener("mouseleave", () => {
        toast._isHovered = false;
        toast._isPaused = false;
        // Reset timer when mouse leaves
        toast._startTime = Date.now();
        toast._pausedTime = 0;
      });
  
      // Add click to dismiss
      toast.addEventListener("click", () => {
        this.dismiss(toast);
      });
  
      return toast;
    }
  
    startTimer(toast) {
      const duration = 4000; // 4 seconds for better readability
      toast._startTime = Date.now();
  
      const updateProgress = () => {
        if (!this.activeToasts.has(toast)) return;
  
        if (!toast._isPaused) {
          const elapsed = Date.now() - toast._startTime;
          const progress = Math.max(0, 100 - (elapsed / duration) * 100);
  
          toast._progress = progress;
          toast._pausedTime = elapsed;
          toast._progressFill.style.width = `${progress}%`;
  
          if (progress <= 0) {
            this.dismiss(toast);
            return;
          }
        }
  
        requestAnimationFrame(updateProgress);
      };
  
      requestAnimationFrame(updateProgress);
    }
  
    dismiss(toast) {
      if (!this.activeToasts.has(toast)) return;
  
      this.activeToasts.delete(toast);
  
      toast.style.transform = "translateX(100%)";
      toast.style.opacity = "0";
  
      setTimeout(() => {
        if (toast.parentNode) {
          toast.parentNode.removeChild(toast);
        }
      }, 300);
    }
  }
  
  // Export for use in other files
  export { ToastManager, compatOrder };