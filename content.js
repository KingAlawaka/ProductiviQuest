// Content script for activity detection
class ActivityDetector {
  constructor() {
    this.lastActivity = Date.now();
    this.isActive = true;
    this.init();
  }

  init() {
    // Track user interactions
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
    
    events.forEach(event => {
      document.addEventListener(event, () => {
        this.lastActivity = Date.now();
        this.isActive = true;
      }, true);
    });

    // Check for inactivity every 30 seconds
    setInterval(() => {
      const timeSinceLastActivity = Date.now() - this.lastActivity;
      this.isActive = timeSinceLastActivity < 60000; // 1 minute threshold
    }, 30000);

    // Listen for messages from background script
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
      if (request.action === 'checkActivity') {
        sendResponse({ isActive: this.isActive });
      }
    });
  }
}

// Initialize activity detector
new ActivityDetector();