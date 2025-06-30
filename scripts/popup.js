// ProductiviQuest Popup Script
class PopupController {
  constructor() {
    this.init();
  }

  async init() {
    await this.loadData();
    this.setupEventListeners();
    this.updateDisplay();
    
    // Refresh data every 30 seconds
    setInterval(() => {
      this.loadData().then(() => this.updateDisplay());
    }, 30000);
  }

  async loadData() {
    try {
      const result = await chrome.storage.local.get([
        'dailyStats', 'level', 'experience', 'streak', 'achievements', 'goals'
      ]);
      
      this.data = {
        dailyStats: result.dailyStats || { totalTime: 0, productiveTime: 0, distractingTime: 0, score: 0 },
        level: result.level || 1,
        experience: result.experience || 0,
        streak: result.streak || 0,
        achievements: result.achievements || [],
        goals: result.goals || { dailyProductiveHours: 6 }
      };
    } catch (error) {
      console.error('Error loading data:', error);
      this.data = {
        dailyStats: { totalTime: 0, productiveTime: 0, distractingTime: 0, score: 0 },
        level: 1,
        experience: 0,
        streak: 0,
        achievements: [],
        goals: { dailyProductiveHours: 6 }
      };
    }
  }

  setupEventListeners() {
    // Dashboard button
    document.getElementById('openDashboard').addEventListener('click', () => {
      chrome.tabs.create({ url: chrome.runtime.getURL('dashboard.html') });
    });

    // Settings button
    document.getElementById('openSettings').addEventListener('click', () => {
      chrome.tabs.create({ url: chrome.runtime.getURL('dashboard.html#settings') });
    });

    // Quick action buttons
    document.getElementById('startFocusMode').addEventListener('click', () => {
      this.startFocusMode();
    });

    document.getElementById('takeBreak').addEventListener('click', () => {
      this.takeBreak();
    });

    document.getElementById('exportData').addEventListener('click', () => {
      this.exportData();
    });
  }

  updateDisplay() {
    // Update level
    document.getElementById('userLevel').textContent = this.data.level;

    // Update score with animation
    this.animateScore(this.data.dailyStats.score);

    // Update time displays
    document.getElementById('productiveTime').textContent = 
      this.formatTime(this.data.dailyStats.productiveTime);
    document.getElementById('distractingTime').textContent = 
      this.formatTime(this.data.dailyStats.distractingTime);

    // Update goal progress
    const productiveHours = this.data.dailyStats.productiveTime / (1000 * 60 * 60);
    const goalProgress = Math.min((productiveHours / this.data.goals.dailyProductiveHours) * 100, 100);
    document.getElementById('goalProgress').textContent = `${Math.round(goalProgress)}%`;
    document.getElementById('goalProgressBar').style.width = `${goalProgress}%`;

    // Update streak
    document.getElementById('streakCount').textContent = `${this.data.streak} days`;
    this.updateStreakFlames();

    // Update achievements
    this.updateAchievements();
  }

  animateScore(targetScore) {
    const scoreElement = document.getElementById('scoreValue');
    const progressElement = document.getElementById('scoreProgress');
    const currentScore = parseInt(scoreElement.textContent) || 0;
    
    // Animate number
    const duration = 1000;
    const startTime = Date.now();
    const scoreDiff = targetScore - currentScore;

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      const currentValue = Math.round(currentScore + (scoreDiff * this.easeOutCubic(progress)));
      scoreElement.textContent = currentValue;
      
      // Update progress circle
      const progressDegrees = (currentValue / 100) * 360;
      progressElement.style.setProperty('--progress', `${progressDegrees}deg`);
      
      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    animate();
  }

  easeOutCubic(t) {
    return 1 - Math.pow(1 - t, 3);
  }

  updateStreakFlames() {
    const flamesElement = document.getElementById('streakFlames');
    const streak = this.data.streak;
    
    if (streak >= 30) {
      flamesElement.textContent = '🔥🔥🔥';
    } else if (streak >= 7) {
      flamesElement.textContent = '🔥🔥';
    } else if (streak >= 3) {
      flamesElement.textContent = '🔥';
    } else {
      flamesElement.textContent = '✨';
    }
  }

  updateAchievements() {
    const achievementsContainer = document.getElementById('achievementsList');
    
    if (this.data.achievements.length === 0) {
      achievementsContainer.innerHTML = '<div class="no-achievements">Start browsing to earn achievements!</div>';
      return;
    }

    const recentAchievements = this.data.achievements.slice(-3);
    achievementsContainer.innerHTML = recentAchievements.map(achievement => {
      const achievementData = this.getAchievementData(achievement);
      return `
        <div class="achievement-badge">
          <span>${achievementData.icon}</span>
          <span>${achievementData.name}</span>
        </div>
      `;
    }).join('');
  }

  getAchievementData(achievementId) {
    const achievements = {
      'high-performer': { name: 'High Performer', icon: '⭐' },
      'focused-worker': { name: 'Focused Worker', icon: '🎯' },
      'productivity-master': { name: 'Productivity Master', icon: '👑' },
      'streak-starter': { name: 'Streak Starter', icon: '🔥' },
      'week-warrior': { name: 'Week Warrior', icon: '💪' },
      'consistency-king': { name: 'Consistency King', icon: '📈' }
    };
    
    return achievements[achievementId] || { name: 'Unknown', icon: '🏆' };
  }

  formatTime(milliseconds) {
    const hours = Math.floor(milliseconds / (1000 * 60 * 60));
    const minutes = Math.floor((milliseconds % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  }

  async startFocusMode() {
    // Create a focus mode notification
    await chrome.notifications.create({
      type: 'basic',
      iconUrl: 'icons/icon48.png',
      title: 'Focus Mode Activated',
      message: 'Stay focused on productive tasks! 🎯'
    });

    // Store focus mode start time
    await chrome.storage.local.set({
      focusMode: {
        active: true,
        startTime: Date.now()
      }
    });

    // Update UI to show focus mode is active
    const focusBtn = document.getElementById('startFocusMode');
    focusBtn.style.background = '#10b981';
    focusBtn.style.color = 'white';
    focusBtn.title = 'Focus Mode Active';
  }

  async takeBreak() {
    await chrome.notifications.create({
      type: 'basic',
      iconUrl: 'icons/icon48.png',
      title: 'Break Time',
      message: 'Take a well-deserved break! Return refreshed. ☕'
    });

    // Record break in storage
    const { breaks = [] } = await chrome.storage.local.get(['breaks']);
    breaks.push({
      timestamp: Date.now(),
      duration: 5 * 60 * 1000 // 5 minutes
    });
    
    await chrome.storage.local.set({ breaks });
  }

  async exportData() {
    try {
      const allData = await chrome.storage.local.get(null);
      const dataStr = JSON.stringify(allData, null, 2);
      const blob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = url;
      a.download = `productiviquest-data-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      
      URL.revokeObjectURL(url);

      // Show success notification
      await chrome.notifications.create({
        type: 'basic',
        iconUrl: 'icons/icon48.png',
        title: 'Data Exported',
        message: 'Your ProductiviQuest data has been exported successfully! 💾'
      });
    } catch (error) {
      console.error('Export failed:', error);
    }
  }
}

// Initialize popup when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  new PopupController();
});