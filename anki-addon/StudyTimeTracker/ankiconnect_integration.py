# AnkiConnect integration for Study Time Tracker
# This file extends AnkiConnect with custom actions

# Add these actions to AnkiConnect:
# - getStudyTime: returns total study time in milliseconds
# - resetStudyTime: resets study time counter

# To use with AnkiConnect, you need to have AnkiConnect installed
# and add this integration to expose study time data

ACTIONS = {
    'getStudyTime': 'get_study_time_handler',
    'resetStudyTime': 'reset_study_time_handler'
}

def get_study_time_handler(params=None):
    """Handler for getStudyTime action"""
    from . import tracker
    return tracker.get_study_time()

def reset_study_time_handler(params=None):
    """Handler for resetStudyTime action"""
    from . import tracker
    tracker.reset_study_time()
    return True

# Instructions for manual AnkiConnect integration:
# If you have AnkiConnect installed, edit its plugin file and add:
#
# from StudyTimeTracker.ankiconnect_integration import get_study_time_handler, reset_study_time_handler
#
# Then in the action handlers dict, add:
# 'getStudyTime': get_study_time_handler,
# 'resetStudyTime': reset_study_time_handler,
