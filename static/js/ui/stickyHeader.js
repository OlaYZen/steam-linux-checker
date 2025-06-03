// stickyHeader.js
export class StickyHeader {
  constructor() {
    this.stickyHeader = document.querySelector('.sticky-header');
    this.mainTitle = document.querySelector('h1');
    this.stickyTitle = document.querySelector('.sticky-title');
    
    this.initialize();
  }

  initialize() {
    if (this.stickyHeader) {
      window.addEventListener('scroll', () => this.handleScroll());
      this.handleResize();
      window.addEventListener('resize', () => this.handleResize());
    }
  }

  handleResize() {
    if (this.stickyTitle) {
      if (window.innerWidth <= 640) {
        this.stickyTitle.textContent = 'SGC';
      } else {
        this.stickyTitle.textContent = 'Steam Games Compatibility';
      }
    }
  }

  handleScroll() {
    if (window.scrollY > 180) {
      this.stickyHeader.classList.add('scrolled');
      if (this.mainTitle) this.mainTitle.style.opacity = '0';
    } else {
      this.stickyHeader.classList.remove('scrolled');
      if (this.mainTitle) this.mainTitle.style.opacity = '1';
    }
  }
} 