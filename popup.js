// Popup script for Study Time Enforcer

function formatTime(ms) {
  if (ms <= 0) return "00:00:00";
  const hours = Math.floor(ms / 3600000);
  const minutes = Math.floor((ms % 3600000) / 60000);
  const seconds = Math.floor((ms % 60000) / 1000);
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

function updateUI(state) {
  const progressFill = document.getElementById('progressFill');
  const progressLabel = document.getElementById('progressLabel');
  const timeStudied = document.getElementById('timeStudied');
  const timeRemaining = document.getElementById('timeRemaining');
  const statusIcon = document.getElementById('statusIcon');
  const statusText = document.getElementById('statusText');

  const progress = Math.min(100, Math.round((state.totalTimeSpent / state.requiredTime) * 100));
  const remaining = Math.max(0, state.requiredTime - state.totalTimeSpent);

  progressFill.style.width = progress + '%';
  progressLabel.textContent = progress + '%';
  timeStudied.textContent = formatTime(state.totalTimeSpent);
  timeRemaining.textContent = formatTime(remaining);

  if (state.isUnlocked) {
    statusIcon.textContent = '✅';
    statusText.textContent = 'All Sites Unlocked!';
    statusText.className = 'status-text unlocked';
  } else if (state.isOnGoalSite) {
    statusIcon.textContent = '🎯';
    statusText.textContent = 'Studying Now...';
    statusText.className = 'status-text';
  } else {
    statusIcon.textContent = '🔒';
    statusText.textContent = 'Sites Blocked';
    statusText.className = 'status-text locked';
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
