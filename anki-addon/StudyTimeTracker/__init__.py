# Study Time Tracker - Anki Add-on
# Tracks time spent studying in Anki and exposes via AnkiConnect

from aqt import mw, gui_hooks
from aqt.qt import QTimer
import time
import json

ADDON_NAME = "StudyTimeTracker"

class StudyTimeTracker:
    def __init__(self):
        self.study_start_time = None
        self.total_study_time = 0  # in milliseconds
        self.last_activity = time.time()
        self.is_studying = False

        # Load saved state
        self.load_state()

        # Timer to track study sessions
        self.timer = QTimer()
        self.timer.timeout.connect(self.update_time)
        self.timer.start(1000)  # Update every second

        # Hook into Anki events
        gui_hooks.reviewer_did_show_question.append(self.on_question_shown)
        gui_hooks.reviewer_did_show_answer.append(self.on_answer_shown)
        gui_hooks.profile_will_close.append(self.on_profile_close)

    def on_question_shown(self, card):
        """Called when a question is shown"""
        if not self.is_studying:
            self.study_start_time = time.time()
            self.is_studying = True
        self.last_activity = time.time()

    def on_answer_shown(self, card):
        """Called when an answer is shown"""
        self.last_activity = time.time()

    def update_time(self):
        """Update study time every second"""
        current_time = time.time()

        # If studying and recently active (within 5 seconds)
        if self.is_studying and (current_time - self.last_activity) < 5:
            if self.study_start_time:
                elapsed = (current_time - self.study_start_time) * 1000  # to ms
                self.total_study_time += 1000  # Add 1 second
                self.study_start_time = current_time
        else:
            # Idle too long, stop tracking
            if self.is_studying:
                self.is_studying = False
                self.study_start_time = None

        # Save state periodically (every 5 seconds)
        if int(current_time) % 5 == 0:
            self.save_state()

    def load_state(self):
        """Load saved study time from Anki's config"""
        config = mw.addonManager.getConfig(__name__)
        if config:
            self.total_study_time = config.get('total_study_time', 0)

    def save_state(self):
        """Save study time to Anki's config"""
        config = {
            'total_study_time': self.total_study_time
        }
        mw.addonManager.writeConfig(__name__, config)

    def on_profile_close(self):
        """Save state when profile closes"""
        self.save_state()

    def get_study_time(self):
        """Get total study time in milliseconds"""
        return self.total_study_time

    def reset_study_time(self):
        """Reset study time counter"""
        self.total_study_time = 0
        self.save_state()

# Initialize tracker
tracker = StudyTimeTracker()

# Expose functions to AnkiConnect
def get_anki_study_time():
    """Returns study time in milliseconds"""
    return tracker.get_study_time()

def reset_anki_study_time():
    """Resets the study time counter"""
    tracker.reset_study_time()
    return True
