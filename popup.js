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
  // Safety checks for undefined/null values
  const totalTime = state.totalTimeSpent || 0;
  const requiredTime = state.requiredTime || 3600000; // 1 hour default
  const cycleRemaining = state.cycleRemaining || 0;
  const ankiTime = state.ankiStudyTime || 0;
  const ankiRequired = state.ankiRequiredTime || 1800000; // 30 min default

  // Progress should reflect BOTH requirements being met
  // Calculate progress for total time (0-50%)
  const timeProgress = Math.min(50, (totalTime / requiredTime) * 50);

  // Calculate progress for Anki requirement (0-50%)
  const ankiProgress = Math.min(50, (ankiTime / ankiRequired) * 50);

  // Combined progress
  const progress = Math.round(timeProgress + ankiProgress);

  // Calculate remaining time based on what's missing
  let remaining;
  if (ankiTime < ankiRequired) {
    // If Anki requirement not met, show at least 30m remaining
    const ankiRemaining = ankiRequired - ankiTime;
    const timeRemaining = Math.max(0, requiredTime - totalTime);
    remaining = Math.max(ankiRemaining, timeRemaining);
  } else {
    // Anki done, just show total time remaining
    remaining = Math.max(0, requiredTime - totalTime);
  }

  // Ensure progress is a valid number
  const validProgress = isNaN(progress) ? 0 : progress;

  document.getElementById('progress').textContent = makeProgressBar(validProgress);
  document.getElementById('webTime').textContent = 'Web: ' + formatTime(state.webStudyTime || 0);

  const ankiStatus = state.ankiRequirementMet ? '✓' : '✗';
  document.getElementById('ankiTime').textContent = 'Anki: ' + formatTime(state.ankiStudyTime || 0) + ' ' + ankiStatus;

  document.getElementById('timeRemaining').textContent = 'Remaining: ' + formatTime(remaining);

  // Show cycle countdown only if started (Anki done)
  if (cycleRemaining === null) {
    document.getElementById('cycleReset').textContent = 'Cycle starts after Anki done';
  } else {
    document.getElementById('cycleReset').textContent = 'Cycle resets in: ' + formatTime(cycleRemaining);
  }

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
