// Study Time Enforcer - Background Script

const GOAL_SITES = [
  'hackthebox.com',
  'hackthebox.eu',
  'app.hackthebox.com',
  'freecodecamp.org',
  'www.freecodecamp.org'
];

const REQUIRED_TIME_MS = 60 * 60 * 1000; // 1 hour in milliseconds
const ANKI_REQUIRED_TIME_MS = 30 * 60 * 1000; // 30 minutes required in Anki
const CYCLE_DURATION_MS = 4 * 60 * 60 * 1000; // 4 hours in milliseconds
const ANKICONNECT_URL = 'http://127.0.0.1:8765';

let state = {
  totalTimeSpent: 0,
  ankiStudyTime: 0,
  currentSessionStart: null,
  isOnGoalSite: false,
  isUnlocked: false,
  cycleStartTime: Date.now(),
  lastAnkiCheck: 0
};

// Load state from storage
browser.storage.local.get(['studyState']).then(result => {
  if (result.studyState) {
    state = result.studyState;
    // Don't restore session start time (always start fresh)
    state.currentSessionStart = null;
    state.isOnGoalSite = false;

    // Check if cycle has expired (4 hours passed)
    if (!state.cycleStartTime) {
      state.cycleStartTime = Date.now();
    }
    checkCycleReset();
  } else {
    state.cycleStartTime = Date.now();
    saveState();
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

// Check if 4-hour cycle has expired and reset if needed
function checkCycleReset() {
  const cycleElapsed = Date.now() - state.cycleStartTime;
  if (cycleElapsed >= CYCLE_DURATION_MS) {
    // Reset the cycle
    state.totalTimeSpent = 0;
    state.ankiStudyTime = 0;
    state.isUnlocked = false;
    state.cycleStartTime = Date.now();
    state.lastAnkiCheck = 0;
    saveState();
    console.log('4-hour cycle expired, progress reset');
  }
}

// Check AnkiConnect for study time
async function checkAnkiStudyTime() {
  try {
    const response = await fetch(ANKICONNECT_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'getStudyTime',
        version: 6
      })
    });

    if (response.ok) {
      const data = await response.json();
      if (data.result !== null && data.result !== undefined) {
        state.ankiStudyTime = data.result;
        state.lastAnkiCheck = Date.now();
      }
    }
  } catch (err) {
    // AnkiConnect not available or Anki not running
    console.log('AnkiConnect not available');
  }
}

// Check if goal is reached (1 hour total, with at least 30 min from Anki)
function checkGoalReached() {
  const totalTime = state.totalTimeSpent + state.ankiStudyTime;
  const ankiRequirementMet = state.ankiStudyTime >= ANKI_REQUIRED_TIME_MS;

  return totalTime >= REQUIRED_TIME_MS && ankiRequirementMet;
}

// Update time tracking
function updateTimeTracking() {
  if (state.currentSessionStart && state.isOnGoalSite) {
    const sessionTime = Date.now() - state.currentSessionStart;
    state.totalTimeSpent += sessionTime;
    state.currentSessionStart = Date.now();

    // Check if goal is reached
    if (checkGoalReached() && !state.isUnlocked) {
      state.isUnlocked = true;

      // Show notification
      browser.notifications.create({
        type: 'basic',
        iconUrl: 'icons/icon-128.png',
        title: 'Goal Achieved!',
        message: 'You\'ve completed 1 hour of study time. All websites are now unlocked!'
      });

      // Play success sound
      browser.tabs.create({ url: browser.runtime.getURL('success.html'), active: false });
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

// Auto-save every 5 seconds and check cycle and Anki
setInterval(() => {
  if (state.isOnGoalSite) {
    updateTimeTracking();
  }
  checkCycleReset();
  checkAnkiStudyTime();
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
    // Check cycle before responding
    checkCycleReset();

    // Check Anki time
    checkAnkiStudyTime().then(() => {
      // Calculate current session time if on goal site
      let currentSessionTime = 0;
      if (state.isOnGoalSite && state.currentSessionStart) {
        currentSessionTime = Date.now() - state.currentSessionStart;
      }

      const cycleElapsed = Date.now() - state.cycleStartTime;
      const cycleRemaining = Math.max(0, CYCLE_DURATION_MS - cycleElapsed);
      const totalTime = state.totalTimeSpent + currentSessionTime + state.ankiStudyTime;
      const ankiRequirementMet = state.ankiStudyTime >= ANKI_REQUIRED_TIME_MS;

      sendResponse({
        totalTimeSpent: totalTime,
        webStudyTime: state.totalTimeSpent + currentSessionTime,
        ankiStudyTime: state.ankiStudyTime,
        isOnGoalSite: state.isOnGoalSite,
        isUnlocked: state.isUnlocked,
        requiredTime: REQUIRED_TIME_MS,
        ankiRequiredTime: ANKI_REQUIRED_TIME_MS,
        ankiRequirementMet: ankiRequirementMet,
        cycleRemaining: cycleRemaining
      });
    });
    return true;
  }
});

console.log('Study Time Enforcer: Background script loaded');
