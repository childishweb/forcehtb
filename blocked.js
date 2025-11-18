// Blocked page script - updates progress display

function formatTime(ms) {
  if (ms <= 0) return "00:00:00";
  const hours = Math.floor(ms / 3600000);
  const minutes = Math.floor((ms % 3600000) / 60000);
  const seconds = Math.floor((ms % 60000) / 1000);
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

function updateProgress() {
  browser.runtime.sendMessage({ action: 'getState' }).then(state => {
    const progress = Math.min(100, Math.round((state.totalTimeSpent / state.requiredTime) * 100));
    const remaining = Math.max(0, state.requiredTime - state.totalTimeSpent);

    document.getElementById('progress').textContent = 'Progress: ' + progress + '%';
    document.getElementById('timeLeft').textContent = 'Time remaining: ' + formatTime(remaining);
  }).catch(err => {
    console.error('Error getting state:', err);
  });
}

// Update immediately
updateProgress();

// Update every second
setInterval(updateProgress, 1000);
