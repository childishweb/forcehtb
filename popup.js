// Popup script for Study Time Enforcer

function formatTime(ms) {
  if (ms <= 0) return "00:00:00";
  const hours = Math.floor(ms / 3600000);
  const minutes = Math.floor((ms % 3600000) / 60000);
  const seconds = Math.floor((ms % 60000) / 1000);
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

function makeProgressBar(percent) {
  const total = 20;
  const filled = Math.round((percent / 100) * total);
  const empty = total - filled;
  return '[' + '#'.repeat(filled) + ' '.repeat(empty) + '] ' + percent + '%';
}

function updateUI(state) {
  const progress = Math.min(100, Math.round((state.totalTimeSpent / state.requiredTime) * 100));
  const remaining = Math.max(0, state.requiredTime - state.totalTimeSpent);

  document.getElementById('progress').textContent = makeProgressBar(progress);
  document.getElementById('webTime').textContent = 'Web: ' + formatTime(state.webStudyTime || 0);

  const ankiStatus = state.ankiRequirementMet ? '✓' : '✗';
  document.getElementById('ankiTime').textContent = 'Anki: ' + formatTime(state.ankiStudyTime || 0) + ' ' + ankiStatus;

  document.getElementById('timeRemaining').textContent = 'Remaining: ' + formatTime(remaining);
  document.getElementById('cycleReset').textContent = 'Cycle resets in: ' + formatTime(state.cycleRemaining);

  if (state.isUnlocked) {
    document.getElementById('status').textContent = 'Unlocked';
  } else if (state.isOnGoalSite) {
    document.getElementById('status').textContent = 'Studying...';
  } else {
    document.getElementById('status').textContent = 'Blocked';
  }
}

function loadState() {
  browser.runtime.sendMessage({ action: 'getState' }).then(state => {
    updateUI(state);
  }).catch(err => {
    console.error('Error loading state:', err);
  });
}

// Update UI every second
setInterval(loadState, 1000);

// Initial load
loadState();
