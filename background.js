// Study Time Enforcer - Background Script

const GOAL_SITES = [
  'hackthebox.com',
  'hackthebox.eu',
  'app.hackthebox.com',
  'freecodecamp.org',
  'www.freecodecamp.org'
];

const REQUIRED_TIME_MS = 60 * 60 * 1000; // 1 hour in milliseconds

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
        details.url.startsWith('file://')) {
      return { cancel: false };
    }

    // Block everything else by redirecting to blocked page
    return {
      redirectUrl: browser.runtime.getURL('blocked.html')
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
