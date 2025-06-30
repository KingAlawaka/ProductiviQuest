# ProductiviQuest - Gamified Productivity Browser Extension

Transform your browsing habits into an engaging RPG-like experience with ProductiviQuest! This browser extension tracks your website activity, categorizes your browsing as productive or distracting, and rewards you with achievements, levels, and detailed analytics.

## 🎮 Features

### Core Functionality
- **Real-time Activity Tracking**: Monitors active browsing time across all websites
- **Smart Categorization**: Automatically categorizes websites as productive, distracting, or neutral
- **Activity Detection**: Uses advanced algorithms to detect when you're actually active on a page
- **Session Recording**: Tracks detailed browsing sessions with timestamps and durations

### Gamification Elements
- **Daily Productivity Score**: Dynamic scoring system (0-100) based on your browsing habits
- **Achievement System**: Unlock badges for meeting productivity goals and milestones
- **Level Progression**: Gain experience points and level up based on consistent productivity
- **Streak Counters**: Maintain productivity streaks and see your progress over time
- **Daily/Weekly Challenges**: Complete specific goals to earn bonus rewards

### Analytics Dashboard
- **Comprehensive Overview**: Real-time productivity metrics and quick stats
- **Interactive Charts**: Visual representations of your productivity trends
- **Category Breakdown**: Detailed analysis of time spent in each category
- **Website Rankings**: See which sites consume most of your time
- **Historical Data**: Track your progress over weeks and months

### Customization & Settings
- **Custom Categories**: Add your own websites to productive/distracting lists
- **Goal Setting**: Set personalized daily productivity targets
- **Theme Support**: Choose between light and dark themes
- **Notification Control**: Customize achievement notifications and sounds
- **Data Export**: Export your productivity data for external analysis

## 🚀 Development Setup

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn
- Chrome/Edge browser for testing

### Installation

1. **Clone and Install**:
   ```bash
   git clone <repository-url>
   cd productiviquest
   npm install
   ```

2. **Development Server**:
   ```bash
   npm run dev
   ```
   This starts the Vite development server at http://localhost:3000

3. **Build Extension**:
   ```bash
   npm run extension:build
   ```
   This builds the React app and copies all extension files to the `dist/` directory

4. **Load Extension in Browser**:
   - Open Chrome/Edge and go to `chrome://extensions/`
   - Enable "Developer mode" in the top right
   - Click "Load unpacked" and select the `dist/` folder
   - The ProductiviQuest icon should appear in your toolbar

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build React application
- `npm run extension:build` - Build extension for production
- `npm run extension:copy` - Copy extension files to dist
- `npm run serve` - Serve built files locally
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## 📊 How It Works

### Productivity Scoring
The extension calculates your daily productivity score using a sophisticated algorithm:
- **Productive Time**: Contributes positively to your score
- **Distracting Time**: Applies penalties to your score
- **Activity Detection**: Only counts time when you're actively using the page
- **Session Length**: Considers focus duration and break patterns

### Achievement System
Unlock achievements by:
- Maintaining high productivity scores (80%+ for High Performer)
- Spending significant time on productive sites (4+ hours for Focused Worker)
- Building consistency streaks (3+ days for Streak Starter)
- Reaching productivity milestones (90%+ for Productivity Master)

### Data Privacy
- **Local Storage Only**: All data stays on your device
- **No External Servers**: No data is sent to external services
- **Full Control**: Export or delete your data anytime
- **Transparent Tracking**: See exactly what's being tracked

## 🎯 Default Categories

### Productive Sites
- GitHub, Stack Overflow, Google Docs
- Notion, Coursera, Udemy
- LinkedIn Learning, and more

### Distracting Sites
- Facebook, Twitter, Instagram
- YouTube, Netflix, Reddit
- TikTok, Twitch, and more

### Neutral Sites
- Google Search, Gmail
- Google Calendar, Google Drive

*You can customize these categories in the settings!*

## 🏆 Achievement List

- **High Performer** ⭐ - Achieve 80% productivity score
- **Focused Worker** 🎯 - Spend 4+ hours on productive sites
- **Productivity Master** 👑 - Achieve 90% productivity score
- **Streak Starter** 🔥 - Maintain 3-day productivity streak
- **Week Warrior** 💪 - Complete a full productive week
- **Consistency King** 📈 - Maintain 14-day productivity streak
- **Focus Master** 🧘 - Complete 25+ minute focus sessions
- **Distraction Destroyer** ⚔️ - Spend less than 1 hour on distracting sites
- **Early Bird** 🌅 - Start productive work before 8 AM
- **Night Owl** 🌙 - Stay productive after 10 PM
- **Level Up** 📊 - Reach level 5
- **Productivity Guru** 🧙 - Reach level 10

## 🛠️ Technical Details

### Architecture
- **Manifest V3**: Uses the latest Chrome extension standards
- **Service Worker**: Efficient background tracking with minimal resource usage
- **Content Scripts**: Lightweight activity detection on web pages
- **Local Storage**: Chrome storage API for reliable data persistence
- **React Frontend**: Modern UI built with React and Tailwind CSS

### Performance
- **Minimal Impact**: Designed to have negligible effect on browser performance
- **Smart Tracking**: Only tracks when you're actively using a page
- **Efficient Storage**: Optimized data structures for fast access
- **Background Processing**: All heavy computations happen in the background

### Browser Compatibility
- **Chrome**: Full support (recommended)
- **Edge**: Full support
- **Firefox**: Compatible with minor modifications
- **Safari**: Requires adaptation for Safari's extension system

## 📈 Data Export

Export your productivity data in JSON format for:
- Personal analysis and insights
- Integration with other productivity tools
- Backup and data portability
- Custom reporting and visualization

## 🔧 File Structure

```
ProductiviQuest/
├── manifest.json          # Extension configuration
├── background.js          # Service worker for tracking
├── content.js            # Activity detection script
├── popup.html/css/js     # Extension popup interface
├── dashboard.html/css/js # Full analytics dashboard
├── scripts/              # Build and utility scripts
├── styles/              # CSS stylesheets
├── icons/               # Extension icons
├── src/                 # React source code
└── dist/               # Built extension files
```

### Key Components
- **ProductivityTracker**: Main tracking logic and data management
- **ActivityDetector**: User activity detection on web pages
- **PopupController**: Popup interface and quick stats
- **DashboardController**: Full dashboard with charts and settings

## 🤝 Contributing

We welcome contributions! Areas for improvement:
- Additional achievement types
- Enhanced analytics visualizations
- Mobile browser support
- Integration with external productivity tools
- Advanced categorization algorithms

## 📄 License

This project is open source and available under the MIT License.

## 🎉 Get Started

Ready to gamify your productivity? 

1. Run `npm run extension:build` to build the extension
2. Load the `dist/` folder in your browser's extension manager
3. Start browsing and watch your productivity score grow!

Track your progress, unlock achievements, and discover insights about your digital behavior.

**Happy browsing, and may your productivity score be ever in your favor!** 🏆