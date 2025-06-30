// Background service worker for ProductiviQuest
class ProductivityTracker {
  constructor() {
    this.currentTab = null;
    this.startTime = null;
    this.isActive = true;
    this.checkInterval = null;
    this.init();
  }

  async init() {
    // Initialize storage structure
    await this.initializeStorage();
    
    // Set up event listeners
    chrome.tabs.onActivated.addListener((activeInfo) => {
      this.onTabChanged(activeInfo.tabId);
    });

    chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
      if (changeInfo.status === 'complete' && tab.active) {
        this.onTabChanged(tabId);
      }
    });

    chrome.windows.onFocusChanged.addListener((windowId) => {
      this.isActive = windowId !== chrome.windows.WINDOW_ID_NONE;
      if (!this.isActive) {
        this.stopTracking();
      } else {
        this.resumeTracking();
      }
    });

    // Set up daily reset alarm
    chrome.alarms.create('dailyReset', { 
      when: this.getTomorrowMidnight(),
      periodInMinutes: 24 * 60 
    });

    chrome.alarms.onAlarm.addListener((alarm) => {
      if (alarm.name === 'dailyReset') {
        this.resetDailyStats();
      }
    });

    // Start tracking current tab
    this.getCurrentTab();
  }

  async initializeStorage() {
    const defaultData = {
      dailyStats: {
        date: new Date().toDateString(),
        totalTime: 0,
        productiveTime: 0,
        distractingTime: 0,
        neutralTime: 0,
        sessions: [],
        score: 0
      },
      weeklyStats: [],
      achievements: [],
      level: 1,
      experience: 0,
      streak: 0,
      goals: {
        dailyProductiveHours: 6,
        maxDistractingHours: 2,
        focusSessionMinutes: 25
      },
      categories: {
        productive: [
          'github.com', 'stackoverflow.com', 'docs.google.com',
          'notion.so', 'coursera.org', 'udemy.com', 'linkedin.com/learning'
        ],
        distracting: [
          'facebook.com', 'twitter.com', 'instagram.com', 'youtube.com',
          'netflix.com', 'reddit.com', 'tiktok.com', 'twitch.tv'
        ],
        neutral: [
          'google.com', 'gmail.com', 'calendar.google.com', 'drive.google.com'
        ]
      },
      settings: {
        theme: 'light',
        notifications: true,
        soundEnabled: true
      }
    };

    const result = await chrome.storage.local.get(Object.keys(defaultData));
    const missingKeys = Object.keys(defaultData).filter(key => !(key in result));
    
    if (missingKeys.length > 0) {
      const missingData = {};
      missingKeys.forEach(key => {
        missingData[key] = defaultData[key];
      });
      await chrome.storage.local.set(missingData);
    }
  }

  async getCurrentTab() {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (tab) {
        this.onTabChanged(tab.id);
      }
    } catch (error) {
      console.error('Error getting current tab:', error);
    }
  }

  async onTabChanged(tabId) {
    try {
      this.stopTracking();
      
      const tab = await chrome.tabs.get(tabId);
      if (tab && tab.url && !tab.url.startsWith('chrome://')) {
        this.currentTab = tab;
        this.startTracking();
      }
    } catch (error) {
      console.error('Error on tab change:', error);
    }
  }

  startTracking() {
    if (!this.currentTab || !this.isActive) return;

    this.startTime = Date.now();
    
    // Check for activity every 5 seconds
    this.checkInterval = setInterval(() => {
      this.checkActivity();
    }, 5000);
  }

  stopTracking() {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }

    if (this.startTime && this.currentTab) {
      const duration = Date.now() - this.startTime;
      this.recordSession(this.currentTab.url, duration);
    }

    this.startTime = null;
  }

  resumeTracking() {
    if (this.currentTab && !this.checkInterval) {
      this.startTracking();
    }
  }

  async checkActivity() {
    try {
      // Send message to content script to check if user is active
      if (this.currentTab) {
        const response = await chrome.tabs.sendMessage(this.currentTab.id, { action: 'checkActivity' });
        if (!response || !response.isActive) {
          this.stopTracking();
        }
      }
    } catch (error) {
      // Tab might be closed or not responsive
      this.stopTracking();
    }
  }

  async recordSession(url, duration) {
    if (duration < 5000) return; // Ignore sessions shorter than 5 seconds

    const domain = this.extractDomain(url);
    const category = this.categorizeWebsite(domain);
    
    const session = {
      url: domain,
      category,
      duration,
      timestamp: Date.now()
    };

    const { dailyStats } = await chrome.storage.local.get(['dailyStats']);
    
    // Check if we need to reset for a new day
    const today = new Date().toDateString();
    if (dailyStats.date !== today) {
      await this.resetDailyStats();
      const { dailyStats: newDailyStats } = await chrome.storage.local.get(['dailyStats']);
      dailyStats = newDailyStats;
    }

    dailyStats.sessions.push(session);
    dailyStats.totalTime += duration;

    switch (category) {
      case 'productive':
        dailyStats.productiveTime += duration;
        break;
      case 'distracting':
        dailyStats.distractingTime += duration;
        break;
      default:
        dailyStats.neutralTime += duration;
    }

    // Calculate productivity score
    dailyStats.score = this.calculateProductivityScore(dailyStats);

    await chrome.storage.local.set({ dailyStats });
    
    // Check for achievements
    await this.checkAchievements();
  }

  extractDomain(url) {
    try {
      return new URL(url).hostname.replace('www.', '');
    } catch {
      return url;
    }
  }

  async categorizeWebsite(domain) {
    const { categories } = await chrome.storage.local.get(['categories']);
    
    if (categories.productive.some(site => domain.includes(site))) {
      return 'productive';
    }
    if (categories.distracting.some(site => domain.includes(site))) {
      return 'distracting';
    }
    if (categories.neutral.some(site => domain.includes(site))) {
      return 'neutral';
    }
    
    return 'neutral'; // Default category
  }

  calculateProductivityScore(stats) {
    if (stats.totalTime === 0) return 0;

    const productiveRatio = stats.productiveTime / stats.totalTime;
    const distractingPenalty = (stats.distractingTime / stats.totalTime) * 0.5;
    
    const baseScore = productiveRatio * 100;
    const penalizedScore = Math.max(0, baseScore - (distractingPenalty * 100));
    
    return Math.round(penalizedScore);
  }

  async checkAchievements() {
    const { dailyStats, achievements, level, experience } = await chrome.storage.local.get([
      'dailyStats', 'achievements', 'level', 'experience'
    ]);

    const newAchievements = [];
    const productiveHours = dailyStats.productiveTime / (1000 * 60 * 60);

    // Check various achievement conditions
    if (dailyStats.score >= 80 && !achievements.includes('high-performer')) {
      newAchievements.push('high-performer');
    }

    if (productiveHours >= 4 && !achievements.includes('focused-worker')) {
      newAchievements.push('focused-worker');
    }

    if (dailyStats.score >= 90 && !achievements.includes('productivity-master')) {
      newAchievements.push('productivity-master');
    }

    if (newAchievements.length > 0) {
      achievements.push(...newAchievements);
      const newExperience = experience + (newAchievements.length * 100);
      const newLevel = Math.floor(newExperience / 1000) + 1;

      await chrome.storage.local.set({
        achievements,
        experience: newExperience,
        level: newLevel
      });

      // Show achievement notification
      this.showAchievementNotification(newAchievements[0]);
    }
  }

  async showAchievementNotification(achievementId) {
    const { settings } = await chrome.storage.local.get(['settings']);
    
    if (settings.notifications) {
      const achievementNames = {
        'high-performer': 'High Performer - 80% productivity score!',
        'focused-worker': 'Focused Worker - 4+ productive hours!',
        'productivity-master': 'Productivity Master - 90% score!'
      };

      chrome.notifications.create({
        type: 'basic',
        iconUrl: 'icons/icon48.png',
        title: 'Achievement Unlocked!',
        message: achievementNames[achievementId] || 'New achievement earned!'
      });
    }
  }

  async resetDailyStats() {
    const { dailyStats, weeklyStats } = await chrome.storage.local.get(['dailyStats', 'weeklyStats']);
    
    // Archive previous day's stats
    if (dailyStats.totalTime > 0) {
      weeklyStats.push({
        ...dailyStats,
        date: dailyStats.date
      });

      // Keep only last 30 days
      if (weeklyStats.length > 30) {
        weeklyStats.splice(0, weeklyStats.length - 30);
      }
    }

    // Reset daily stats
    const newDailyStats = {
      date: new Date().toDateString(),
      totalTime: 0,
      productiveTime: 0,
      distractingTime: 0,
      neutralTime: 0,
      sessions: [],
      score: 0
    };

    await chrome.storage.local.set({
      dailyStats: newDailyStats,
      weeklyStats
    });
  }

  getTomorrowMidnight() {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    return tomorrow.getTime();
  }
}

// Initialize the tracker
new ProductivityTracker();