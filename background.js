// Study Time Enforcer - Background Script

const GOAL_SITES = [
  'hackthebox.com',
  'hackthebox.eu',
  'app.hackthebox.com',
  'freecodecamp.org',
  'www.freecodecamp.org'
];

const REQUIRED_TIME_MS = 60 * 60 * 1000; // 1 hour in milliseconds
const BLOCKED_PAGE_HTML = `
<!DOCTYPE html>
<html>
<head>
  <title>Site Blocked - Study First!</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      display: flex;
      justify-content: center;
      align-items: center;
      height: 100vh;
      margin: 0;
      padding: 20px;
      box-sizing: border-box;
    }
    .container {
      text-align: center;
      background: rgba(255, 255, 255, 0.1);
      backdrop-filter: blur(10px);
      border-radius: 20px;
      padding: 40px;
      max-width: 500px;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
    }
    h1 {
      font-size: 2.5em;
      margin: 0 0 20px 0;
    }
    .icon {
      font-size: 4em;
      margin-bottom: 20px;
    }
    .message {
      font-size: 1.2em;
      margin: 20px 0;
      line-height: 1.6;
    }
    .progress {
      background: rgba(255, 255, 255, 0.2);
      border-radius: 10px;
      height: 30px;
      margin: 20px 0;
      overflow: hidden;
    }
    .progress-bar {
      background: linear-gradient(90deg, #00f260, #0575e6);
      height: 100%;
      transition: width 0.3s ease;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: bold;
    }
    .time-left {
      font-size: 2em;
      font-weight: bold;
      margin: 20px 0;
      font-family: monospace;
    }
    .sites {
      margin: 20px 0;
      padding: 20px;
      background: rgba(255, 255, 255, 0.1);
      border-radius: 10px;
    }
    .site-link {
      display: block;
      color: #fff;
      text-decoration: none;
      padding: 10px;
      margin: 5px 0;
      background: rgba(255, 255, 255, 0.2);
      border-radius: 5px;
      transition: background 0.3s ease;
    }
    .site-link:hover {
      background: rgba(255, 255, 255, 0.3);
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="icon">🚫</div>
    <h1>Focus on Your Goals!</h1>
    <div class="message">
      This site is blocked until you complete 1 hour of study time on your goal websites.
    </div>
    <div class="progress">
      <div class="progress-bar" id="progressBar" style="width: {PROGRESS}%">
        {PROGRESS}%
      </div>
    </div>
    <div class="time-left">
      Time Remaining: {TIME_LEFT}
    </div>
    <div class="sites">
      <strong>Study on these sites:</strong><br><br>
      <a href="https://app.hackthebox.com" class="site-link">🎯 HackTheBox</a>
      <a href="https://www.freecodecamp.org" class="site-link">💻 FreeCodeCamp</a>
    </div>
  </div>
</body>
</html>
`;

let state = {
  totalTimeSpent: 0,
  currentSessionStart: null,
  isOnGoalSite: false,
  isUnlocked: false
};

// Load state from storage
browser.storage.local.get(['studyState']).then(result => {
  if (result.studyState) {
    state = result.studyState;
    // Don't restore session start time (always start fresh)
    state.currentSessionStart = null;
    state.isOnGoalSite = false;
  }
  console.log('Loaded state:', state);
});

// Save state to storage
function saveState() {
  browser.storage.local.set({ studyState: state });
}

// Check if a URL is a goal site
function isGoalSite(url) {
  if (!url) return false;
  try {
    const hostname = new URL(url).hostname.toLowerCase();
    return GOAL_SITES.some(site => hostname.includes(site));
  } catch (e) {
    return false;
  }
}

// Format time remaining
function formatTimeRemaining(ms) {
  if (ms <= 0) return "00:00:00";
  const hours = Math.floor(ms / 3600000);
  const minutes = Math.floor((ms % 3600000) / 60000);
  const seconds = Math.floor((ms % 60000) / 1000);
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

// Update time tracking
function updateTimeTracking() {
  if (state.currentSessionStart && state.isOnGoalSite) {
    const sessionTime = Date.now() - state.currentSessionStart;
    state.totalTimeSpent += sessionTime;
    state.currentSessionStart = Date.now();

    // Check if goal is reached
    if (state.totalTimeSpent >= REQUIRED_TIME_MS && !state.isUnlocked) {
      state.isUnlocked = true;
      browser.notifications.create({
        type: 'basic',
        iconUrl: 'icons/icon-128.png',
        title: 'Goal Achieved!',
        message: 'You\'ve completed 1 hour of study time. All websites are now unlocked!'
      });
    }

    saveState();
  }
}

// Track active tab
browser.tabs.onActivated.addListener(activeInfo => {
  browser.tabs.get(activeInfo.tabId).then(tab => {
    const wasOnGoalSite = state.isOnGoalSite;

    if (wasOnGoalSite) {
      updateTimeTracking();
    }

    state.isOnGoalSite = isGoalSite(tab.url);

    if (state.isOnGoalSite) {
      state.currentSessionStart = Date.now();
    } else {
      state.currentSessionStart = null;
    }
  });
});

// Track tab updates (URL changes)
browser.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.url) {
    const wasOnGoalSite = state.isOnGoalSite;

    browser.tabs.query({ active: true, currentWindow: true }).then(tabs => {
      if (tabs[0] && tabs[0].id === tabId) {
        if (wasOnGoalSite) {
          updateTimeTracking();
        }

        state.isOnGoalSite = isGoalSite(changeInfo.url);

        if (state.isOnGoalSite) {
          state.currentSessionStart = Date.now();
        } else {
          state.currentSessionStart = null;
        }
      }
    });
  }
});

// Periodic update (every second)
setInterval(() => {
  if (state.isOnGoalSite && state.currentSessionStart) {
    const currentSession = Date.now() - state.currentSessionStart;
    // Don't add to total yet, just for display purposes
  }
}, 1000);

// Auto-save every 5 seconds
setInterval(() => {
  if (state.isOnGoalSite) {
    updateTimeTracking();
  }
}, 5000);

// Block non-goal sites
browser.webRequest.onBeforeRequest.addListener(
  details => {
    // Skip if unlocked
    if (state.isUnlocked) {
      return { cancel: false };
    }

    // Allow goal sites
    if (isGoalSite(details.url)) {
      return { cancel: false };
    }

    // Allow extension pages and local files
    if (details.url.startsWith('moz-extension://') ||
        details.url.startsWith('about:') ||
        details.url.startsWith('file://') ||
        details.url.startsWith('data:')) {
      return { cancel: false };
    }

    // Block everything else by redirecting to data URL
    const timeLeft = Math.max(0, REQUIRED_TIME_MS - state.totalTimeSpent);
    const progress = Math.min(100, Math.round((state.totalTimeSpent / REQUIRED_TIME_MS) * 100));

    const blockedPage = BLOCKED_PAGE_HTML
      .replace(/{PROGRESS}/g, progress)
      .replace(/{TIME_LEFT}/g, formatTimeRemaining(timeLeft));

    return {
      redirectUrl: 'data:text/html;charset=utf-8,' + encodeURIComponent(blockedPage)
    };
  },
  { urls: ["<all_urls>"], types: ["main_frame"] },
  ["blocking"]
);

// Listen for messages from popup
browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'getState') {
    // Calculate current session time if on goal site
    let currentSessionTime = 0;
    if (state.isOnGoalSite && state.currentSessionStart) {
      currentSessionTime = Date.now() - state.currentSessionStart;
    }

    sendResponse({
      totalTimeSpent: state.totalTimeSpent + currentSessionTime,
      isOnGoalSite: state.isOnGoalSite,
      isUnlocked: state.isUnlocked,
      requiredTime: REQUIRED_TIME_MS
    });
  } else if (message.action === 'reset') {
    state = {
      totalTimeSpent: 0,
      currentSessionStart: null,
      isOnGoalSite: false,
      isUnlocked: false
    };
    saveState();
    sendResponse({ success: true });
  }
  return true;
});

console.log('Study Time Enforcer: Background script loaded');
