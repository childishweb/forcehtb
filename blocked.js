// Blocked page script - updates progress display

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

function updateProgress() {
  browser.runtime.sendMessage({ action: 'getState' }).then(state => {
    const totalTime = state.totalTimeSpent || 0;
    const requiredTime = state.requiredTime || 3600000;
    const ankiTime = state.ankiStudyTime || 0;
    const ankiRequired = state.ankiRequiredTime || 1800000;

    // Progress reflects BOTH requirements
    const timeProgress = Math.min(50, (totalTime / requiredTime) * 50);
    const ankiProgress = Math.min(50, (ankiTime / ankiRequired) * 50);
    const progress = Math.round(timeProgress + ankiProgress);

    const remaining = Math.max(0, requiredTime - totalTime);

    const ankiStatus = state.ankiRequirementMet ? '✓' : '(need 30m Anki)';
    document.getElementById('progress').textContent = makeProgressBar(progress) + ' ' + ankiStatus;
    document.getElementById('timeLeft').textContent = 'Time remaining: ' + formatTime(remaining);
  }).catch(err => {
    console.error('Error getting state:', err);
  });
}

// Update immediately
updateProgress();

// Update every second
setInterval(updateProgress, 1000);
