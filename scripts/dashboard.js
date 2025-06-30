// ProductiviQuest Dashboard Script
class DashboardController {
  constructor() {
    this.currentTab = 'overview';
    this.data = {};
    this.charts = {};
    this.init();
  }

  async init() {
    await this.loadData();
    this.setupEventListeners();
    this.setupNavigation();
    this.updateAllDisplays();
    this.loadTheme();
    
    // Refresh data every minute
    setInterval(() => {
      this.loadData().then(() => this.updateAllDisplays());
    }, 60000);
  }

  async loadData() {
    try {
      const result = await chrome.storage.local.get(null);
      this.data = {
        dailyStats: result.dailyStats || this.getDefaultDailyStats(),
        weeklyStats: result.weeklyStats || [],
        level: result.level || 1,
        experience: result.experience || 0,
        streak: result.streak || 0,
        achievements: result.achievements || [],
        goals: result.goals || this.getDefaultGoals(),
        categories: result.categories || this.getDefaultCategories(),
        settings: result.settings || this.getDefaultSettings()
      };
    } catch (error) {
      console.error('Error loading data:', error);
    }
  }

  getDefaultDailyStats() {
    return {
      date: new Date().toDateString(),
      totalTime: 0,
      productiveTime: 0,
      distractingTime: 0,
      neutralTime: 0,
      sessions: [],
      score: 0
    };
  }

  getDefaultGoals() {
    return {
      dailyProductiveHours: 6,
      maxDistractingHours: 2,
      focusSessionMinutes: 25
    };
  }

  getDefaultCategories() {
    return {
      productive: ['github.com', 'stackoverflow.com', 'docs.google.com'],
      distracting: ['facebook.com', 'twitter.com', 'instagram.com'],
      neutral: ['google.com', 'gmail.com']
    };
  }

  getDefaultSettings() {
    return {
      theme: 'light',
      notifications: true,
      soundEnabled: true
    };
  }

  setupEventListeners() {
    // Theme toggle
    document.getElementById('themeToggle').addEventListener('click', () => {
      this.toggleTheme();
    });

    // Goal inputs
    document.getElementById('dailyGoal').addEventListener('change', (e) => {
      this.updateGoal('dailyProductiveHours', parseInt(e.target.value));
    });

    document.getElementById('distractingLimit').addEventListener('change', (e) => {
      this.updateGoal('maxDistractingHours', parseInt(e.target.value));
    });

    document.getElementById('focusGoal').addEventListener('change', (e) => {
      this.updateGoal('focusSessionMinutes', parseInt(e.target.value));
    });

    // Settings
    document.getElementById('notificationsEnabled').addEventListener('change', (e) => {
      this.updateSetting('notifications', e.target.checked);
    });

    document.getElementById('soundEnabled').addEventListener('change', (e) => {
      this.updateSetting('soundEnabled', e.target.checked);
    });

    // Category management
    document.getElementById('addProductive').addEventListener('click', () => {
      this.addCategory('productive');
    });

    document.getElementById('addDistracting').addEventListener('click', () => {
      this.addCategory('distracting');
    });

    // Data management
    document.getElementById('exportDataBtn').addEventListener('click', () => {
      this.exportData();
    });

    document.getElementById('resetDataBtn').addEventListener('click', () => {
      this.resetData();
    });
  }

  setupNavigation() {
    const navButtons = document.querySelectorAll('.nav-btn');
    
    navButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        const tab = btn.dataset.tab;
        this.switchTab(tab);
      });
    });

    // Handle hash navigation
    if (window.location.hash) {
      const tab = window.location.hash.replace('#', '');
      this.switchTab(tab);
    }
  }

  switchTab(tabName) {
    // Update navigation
    document.querySelectorAll('.nav-btn').forEach(btn => {
      btn.classList.remove('active');
    });
    document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');

    // Update content
    document.querySelectorAll('.tab-content').forEach(content => {
      content.classList.remove('active');
    });
    document.getElementById(tabName).classList.add('active');

    this.currentTab = tabName;
    window.location.hash = tabName;

    // Load tab-specific content
    if (tabName === 'analytics') {
      setTimeout(() => this.renderCharts(), 100);
    } else if (tabName === 'achievements') {
      this.renderAchievements();
    } else if (tabName === 'settings') {
      this.loadSettings();
    }
  }

  updateAllDisplays() {
    this.updateOverview();
    this.updateHeader();
    this.updateGoalsTab();
    
    if (this.currentTab === 'analytics') {
      this.renderCharts();
    }
  }

  updateHeader() {
    document.getElementById('headerLevel').textContent = this.data.level;
    
    const expNeeded = this.data.level * 1000;
    const expProgress = (this.data.experience % 1000) / 10;
    document.getElementById('expBar').style.width = `${expProgress}%`;
  }

  updateOverview() {
    // Today's score
    this.animateScore('todayScore', this.data.dailyStats.score);
    
    // Time breakdown
    document.getElementById('todayProductive').textContent = 
      this.formatHours(this.data.dailyStats.productiveTime);
    document.getElementById('todayDistracting').textContent = 
      this.formatHours(this.data.dailyStats.distractingTime);

    // Streak and level
    document.getElementById('streakDisplay').textContent = this.data.streak;
    document.getElementById('levelDisplay').textContent = this.data.level;
    
    const expNeeded = this.data.level * 1000;
    const currentExp = this.data.experience % 1000;
    const expProgress = (currentExp / 1000) * 100;
    document.getElementById('levelProgress').style.width = `${expProgress}%`;
    document.getElementById('levelProgressText').textContent = `${currentExp} / ${expNeeded} XP`;

    // Quick stats
    this.updateQuickStats();
    
    // Recent activity
    this.updateRecentActivity();
  }

  updateQuickStats() {
    const sessions = this.data.dailyStats.sessions;
    const uniqueSites = new Set(sessions.map(s => s.url)).size;
    const avgSession = sessions.length > 0 ? 
      (sessions.reduce((sum, s) => sum + s.duration, 0) / sessions.length) / (1000 * 60) : 0;
    
    // Find top category
    const categoryTimes = {
      productive: this.data.dailyStats.productiveTime,
      distracting: this.data.dailyStats.distractingTime,
      neutral: this.data.dailyStats.neutralTime
    };
    const topCategory = Object.keys(categoryTimes).reduce((a, b) => 
      categoryTimes[a] > categoryTimes[b] ? a : b
    );

    // Find longest focus session (consecutive productive time)
    const longestFocus = this.calculateLongestFocus(sessions);

    document.getElementById('totalSites').textContent = uniqueSites;
    document.getElementById('avgSession').textContent = `${Math.round(avgSession)}m`;
    document.getElementById('topCategory').textContent = this.capitalizeFirst(topCategory);
    document.getElementById('focusTime').textContent = `${Math.round(longestFocus)}m`;
  }

  calculateLongestFocus(sessions) {
    let longestFocus = 0;
    let currentFocus = 0;
    
    sessions.forEach(session => {
      if (session.category === 'productive') {
        currentFocus += session.duration;
      } else {
        longestFocus = Math.max(longestFocus, currentFocus);
        currentFocus = 0;
      }
    });
    
    longestFocus = Math.max(longestFocus, currentFocus);
    return longestFocus / (1000 * 60); // Convert to minutes
  }

  updateRecentActivity() {
    const container = document.getElementById('recentActivity');
    const recentSessions = this.data.dailyStats.sessions.slice(-5).reverse();
    
    if (recentSessions.length === 0) {
      container.innerHTML = '<div class="activity-empty">No activity yet today</div>';
      return;
    }

    container.innerHTML = recentSessions.map(session => `
      <div class="activity-item">
        <div>
          <div class="activity-site">${session.url}</div>
          <div class="activity-category">${this.capitalizeFirst(session.category)}</div>
        </div>
        <div class="activity-time">${this.formatMinutes(session.duration)}</div>
      </div>
    `).join('');
  }

  animateScore(elementId, targetScore) {
    const element = document.getElementById(elementId);
    const currentScore = parseInt(element.querySelector('.score-number').textContent) || 0;
    
    const duration = 1000;
    const startTime = Date.now();
    const scoreDiff = targetScore - currentScore;

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      const currentValue = Math.round(currentScore + (scoreDiff * this.easeOutCubic(progress)));
      element.querySelector('.score-number').textContent = currentValue;
      
      // Update progress circle
      const progressDegrees = (currentValue / 100) * 360;
      element.style.setProperty('--progress', `${progressDegrees}deg`);
      
      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    animate();
  }

  renderCharts() {
    this.renderWeeklyChart();
    this.renderCategoryChart();
    this.renderPatternsChart();
    this.renderTopWebsites();
  }

  renderWeeklyChart() {
    const canvas = document.getElementById('weeklyChart');
    const ctx = canvas.getContext('2d');
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Get last 7 days of data
    const weekData = this.getWeeklyData();
    const maxScore = Math.max(...weekData.map(d => d.score), 100);
    
    // Set up dimensions
    const padding = 40;
    const chartWidth = canvas.width - 2 * padding;
    const chartHeight = canvas.height - 2 * padding;
    const barWidth = chartWidth / weekData.length;
    
    // Draw bars
    ctx.fillStyle = '#667eea';
    weekData.forEach((day, index) => {
      const barHeight = (day.score / maxScore) * chartHeight;
      const x = padding + index * barWidth + barWidth * 0.2;
      const y = padding + chartHeight - barHeight;
      const width = barWidth * 0.6;
      
      ctx.fillRect(x, y, width, barHeight);
      
      // Draw day labels
      ctx.fillStyle = '#6b7280';
      ctx.font = '12px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(day.label, x + width / 2, canvas.height - 10);
      
      ctx.fillStyle = '#667eea';
    });
    
    // Draw grid lines
    ctx.strokeStyle = '#e5e7eb';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 4; i++) {
      const y = padding + (chartHeight / 4) * i;
      ctx.beginPath();
      ctx.moveTo(padding, y);
      ctx.lineTo(canvas.width - padding, y);
      ctx.stroke();
      
      // Draw score labels
      const score = maxScore * (4 - i) / 4;
      ctx.fillStyle = '#6b7280';
      ctx.font = '12px Arial';
      ctx.textAlign = 'right';
      ctx.fillText(Math.round(score), padding - 10, y + 4);
    }
  }

  renderCategoryChart() {
    const canvas = document.getElementById('categoryChart');
    const ctx = canvas.getContext('2d');
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    const data = [
      { label: 'Productive', value: this.data.dailyStats.productiveTime, color: '#10b981' },
      { label: 'Distracting', value: this.data.dailyStats.distractingTime, color: '#ef4444' },
      { label: 'Neutral', value: this.data.dailyStats.neutralTime, color: '#6b7280' }
    ];
    
    const total = data.reduce((sum, item) => sum + item.value, 0);
    if (total === 0) {
      ctx.fillStyle = '#6b7280';
      ctx.font = '16px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('No data available', canvas.width / 2, canvas.height / 2);
      return;
    }
    
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const radius = Math.min(centerX, centerY) - 20;
    
    let currentAngle = -Math.PI / 2;
    
    data.forEach(item => {
      const sliceAngle = (item.value / total) * 2 * Math.PI;
      
      // Draw slice
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.arc(centerX, centerY, radius, currentAngle, currentAngle + sliceAngle);
      ctx.fillStyle = item.color;
      ctx.fill();
      
      // Draw label
      const labelAngle = currentAngle + sliceAngle / 2;
      const labelX = centerX + Math.cos(labelAngle) * (radius * 0.7);
      const labelY = centerY + Math.sin(labelAngle) * (radius * 0.7);
      
      ctx.fillStyle = 'white';
      ctx.font = 'bold 12px Arial';
      ctx.textAlign = 'center';
      const percentage = Math.round((item.value / total) * 100);
      if (percentage > 5) { // Only show label if slice is large enough
        ctx.fillText(`${percentage}%`, labelX, labelY);
      }
      
      currentAngle += sliceAngle;
    });
    
    // Draw legend
    let legendY = 20;
    data.forEach(item => {
      ctx.fillStyle = item.color;
      ctx.fillRect(canvas.width - 120, legendY, 15, 15);
      
      ctx.fillStyle = '#333';
      ctx.font = '12px Arial';
      ctx.textAlign = 'left';
      ctx.fillText(item.label, canvas.width - 100, legendY + 12);
      
      legendY += 25;
    });
  }

  renderPatternsChart() {
    const canvas = document.getElementById('patternsChart');
    const ctx = canvas.getContext('2d');
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Generate hourly pattern data
    const hourlyData = this.getHourlyPattern();
    const maxValue = Math.max(...hourlyData, 1);
    
    const padding = 40;
    const chartWidth = canvas.width - 2 * padding;
    const chartHeight = canvas.height - 2 * padding;
    const barWidth = chartWidth / 24;
    
    // Draw bars for each hour
    ctx.fillStyle = '#764ba2';
    hourlyData.forEach((value, hour) => {
      const barHeight = (value / maxValue) * chartHeight;
      const x = padding + hour * barWidth + barWidth * 0.1;
      const y = padding + chartHeight - barHeight;
      const width = barWidth * 0.8;
      
      ctx.fillRect(x, y, width, barHeight);
      
      // Draw hour labels (every 4 hours)
      if (hour % 4 === 0) {
        ctx.fillStyle = '#6b7280';
        ctx.font = '10px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(`${hour}:00`, x + width / 2, canvas.height - 5);
        ctx.fillStyle = '#764ba2';
      }
    });
  }

  renderTopWebsites() {
    const container = document.getElementById('topWebsites');
    const websiteStats = this.getTopWebsites();
    
    if (websiteStats.length === 0) {
      container.innerHTML = '<div class="website-item"><span class="website-name">No data available</span><span class="website-time">0m</span></div>';
      return;
    }
    
    container.innerHTML = websiteStats.map(site => `
      <div class="website-item">
        <span class="website-name">${site.domain}</span>
        <span class="website-time">${this.formatMinutes(site.time)}</span>
      </div>
    `).join('');
  }

  getWeeklyData() {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const weekData = [];
    
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateString = date.toDateString();
      
      const dayData = this.data.weeklyStats.find(d => d.date === dateString) || 
                     (i === 0 ? this.data.dailyStats : { score: 0 });
      
      weekData.push({
        label: days[date.getDay()],
        score: dayData.score || 0
      });
    }
    
    return weekData;
  }

  getHourlyPattern() {
    const hourlyData = new Array(24).fill(0);
    
    this.data.dailyStats.sessions.forEach(session => {
      const hour = new Date(session.timestamp).getHours();
      hourlyData[hour] += session.duration;
    });
    
    return hourlyData.map(time => time / (1000 * 60)); // Convert to minutes
  }

  getTopWebsites() {
    const websiteStats = {};
    
    this.data.dailyStats.sessions.forEach(session => {
      if (!websiteStats[session.url]) {
        websiteStats[session.url] = 0;
      }
      websiteStats[session.url] += session.duration;
    });
    
    return Object.entries(websiteStats)
      .map(([domain, time]) => ({ domain, time }))
      .sort((a, b) => b.time - a.time)
      .slice(0, 10);
  }

  renderAchievements() {
    const container = document.getElementById('achievementsGrid');
    const allAchievements = this.getAllAchievements();
    
    document.getElementById('achievementCount').textContent = this.data.achievements.length;
    document.getElementById('totalAchievements').textContent = allAchievements.length;
    
    container.innerHTML = allAchievements.map(achievement => {
      const unlocked = this.data.achievements.includes(achievement.id);
      return `
        <div class="achievement-card ${unlocked ? 'unlocked' : 'locked'}">
          <div class="achievement-icon">${achievement.icon}</div>
          <div class="achievement-title">${achievement.name}</div>
          <div class="achievement-description">${achievement.description}</div>
        </div>
      `;
    }).join('');
  }

  getAllAchievements() {
    return [
      { id: 'high-performer', name: 'High Performer', icon: '⭐', description: 'Achieve 80% productivity score' },
      { id: 'focused-worker', name: 'Focused Worker', icon: '🎯', description: 'Spend 4+ hours on productive sites' },
      { id: 'productivity-master', name: 'Productivity Master', icon: '👑', description: 'Achieve 90% productivity score' },
      { id: 'streak-starter', name: 'Streak Starter', icon: '🔥', description: 'Maintain a 3-day productivity streak' },
      { id: 'week-warrior', name: 'Week Warrior', icon: '💪', description: 'Complete a full productive week' },
      { id: 'consistency-king', name: 'Consistency King', icon: '📈', description: 'Maintain 14-day productivity streak' },
      { id: 'focus-master', name: 'Focus Master', icon: '🧘', description: 'Complete 25+ minute focus sessions' },
      { id: 'distraction-destroyer', name: 'Distraction Destroyer', icon: '⚔️', description: 'Spend less than 1 hour on distracting sites' },
      { id: 'early-bird', name: 'Early Bird', icon: '🌅', description: 'Start productive work before 8 AM' },
      { id: 'night-owl', name: 'Night Owl', icon: '🌙', description: 'Stay productive after 10 PM' },
      { id: 'level-up', name: 'Level Up', icon: '📊', description: 'Reach level 5' },
      { id: 'productivity-guru', name: 'Productivity Guru', icon: '🧙', description: 'Reach level 10' }
    ];
  }

  updateGoalsTab() {
    // Update goal inputs
    document.getElementById('dailyGoal').value = this.data.goals.dailyProductiveHours;
    document.getElementById('distractingLimit').value = this.data.goals.maxDistractingHours;
    document.getElementById('focusGoal').value = this.data.goals.focusSessionMinutes;
    
    // Update progress displays
    const productiveHours = this.data.dailyStats.productiveTime / (1000 * 60 * 60);
    const distractingHours = this.data.dailyStats.distractingTime / (1000 * 60 * 60);
    
    // Daily goal progress
    const dailyProgress = Math.min((productiveHours / this.data.goals.dailyProductiveHours) * 100, 100);
    document.getElementById('dailyGoalProgress').style.width = `${dailyProgress}%`;
    document.getElementById('dailyGoalText').textContent = 
      `${productiveHours.toFixed(1)} / ${this.data.goals.dailyProductiveHours} hours`;
    
    // Distracting limit progress
    const distractingProgress = Math.min((distractingHours / this.data.goals.maxDistractingHours) * 100, 100);
    document.getElementById('distractingProgress').style.width = `${distractingProgress}%`;
    document.getElementById('distractingText').textContent = 
      `${distractingHours.toFixed(1)} / ${this.data.goals.maxDistractingHours} hours`;
  }

  loadSettings() {
    document.getElementById('notificationsEnabled').checked = this.data.settings.notifications;
    document.getElementById('soundEnabled').checked = this.data.settings.soundEnabled;
    
    this.loadCategoryTags();
  }

  loadCategoryTags() {
    const productiveContainer = document.getElementById('productiveTags');
    const distractingContainer = document.getElementById('distractingTags');
    
    productiveContainer.innerHTML = this.data.categories.productive.map(site => `
      <div class="category-tag productive">
        ${site}
        <button class="tag-remove" onclick="dashboardController.removeCategory('productive', '${site}')">×</button>
      </div>
    `).join('');
    
    distractingContainer.innerHTML = this.data.categories.distracting.map(site => `
      <div class="category-tag distracting">
        ${site}
        <button class="tag-remove" onclick="dashboardController.removeCategory('distracting', '${site}')">×</button>
      </div>
    `).join('');
  }

  async updateGoal(goalType, value) {
    this.data.goals[goalType] = value;
    await chrome.storage.local.set({ goals: this.data.goals });
    this.updateGoalsTab();
  }

  async updateSetting(settingType, value) {
    this.data.settings[settingType] = value;
    await chrome.storage.local.set({ settings: this.data.settings });
  }

  async addCategory(categoryType) {
    const inputId = categoryType === 'productive' ? 'productiveInput' : 'distractingInput';
    const input = document.getElementById(inputId);
    const site = input.value.trim().toLowerCase();
    
    if (site && !this.data.categories[categoryType].includes(site)) {
      this.data.categories[categoryType].push(site);
      await chrome.storage.local.set({ categories: this.data.categories });
      input.value = '';
      this.loadCategoryTags();
    }
  }

  async removeCategory(categoryType, site) {
    const index = this.data.categories[categoryType].indexOf(site);
    if (index > -1) {
      this.data.categories[categoryType].splice(index, 1);
      await chrome.storage.local.set({ categories: this.data.categories });
      this.loadCategoryTags();
    }
  }

  toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('productiviquest-theme', newTheme);
    
    const themeToggle = document.getElementById('themeToggle');
    themeToggle.textContent = newTheme === 'dark' ? '☀️' : '🌙';
  }

  loadTheme() {
    const savedTheme = localStorage.getItem('productiviquest-theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
    
    const themeToggle = document.getElementById('themeToggle');
    themeToggle.textContent = savedTheme === 'dark' ? '☀️' : '🌙';
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
    } catch (error) {
      console.error('Export failed:', error);
    }
  }

  async resetData() {
    if (confirm('Are you sure you want to reset all data? This action cannot be undone.')) {
      await chrome.storage.local.clear();
      location.reload();
    }
  }

  // Utility functions
  formatTime(milliseconds) {
    const hours = Math.floor(milliseconds / (1000 * 60 * 60));
    const minutes = Math.floor((milliseconds % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${minutes}m`;
  }

  formatHours(milliseconds) {
    const hours = milliseconds / (1000 * 60 * 60);
    return `${hours.toFixed(1)}h`;
  }

  formatMinutes(milliseconds) {
    const minutes = Math.round(milliseconds / (1000 * 60));
    return `${minutes}m`;
  }

  capitalizeFirst(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  easeOutCubic(t) {
    return 1 - Math.pow(1 - t, 3);
  }
}

// Initialize dashboard when DOM is loaded
let dashboardController;
document.addEventListener('DOMContentLoaded', () => {
  dashboardController = new DashboardController();
});