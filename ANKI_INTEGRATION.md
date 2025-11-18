# Anki Integration Setup

The extension now integrates with Anki to require 30 minutes of Anki study time as part of the 1-hour goal.

## Requirements

- **Total study time**: 1 hour
- **Anki requirement**: At least 30 minutes in Anki
- **Web time**: Remaining time on HackTheBox/FreeCodeCamp

## Installation Steps

### 1. Install AnkiConnect

1. Open Anki
2. Go to: Tools → Add-ons → Get Add-ons
3. Enter code: `2055492159`
4. Click OK
5. Restart Anki

### 2. Configure AnkiConnect CORS

1. In Anki: Tools → Add-ons → AnkiConnect → Config
2. Update the config to allow Firefox extension access:

```json
{
    "webBindAddress": "127.0.0.1",
    "webBindPort": 8765,
    "webCorsOriginList": [
        "http://localhost",
        "moz-extension://*"
    ]
}
```

3. Click OK and restart Anki

### 3. Install Study Time Tracker Add-on

**Manual Installation:**
1. Copy the `anki-addon/StudyTimeTracker` folder
2. In Anki: Tools → Add-ons → View Files
3. Paste the `StudyTimeTracker` folder into the add-ons directory
4. Restart Anki

**From Zip:**
1. Zip the `StudyTimeTracker` folder
2. In Anki: Tools → Add-ons → Install from file
3. Select the zip file
4. Restart Anki

### 4. Enable Custom AnkiConnect Actions

The Study Time Tracker needs to expose its data via AnkiConnect. You have two options:

**Option A: Automatic (Recommended if you know Python)**
Create a file named `studytime_bridge.py` in your AnkiConnect folder with:

```python
# Add this to AnkiConnect to expose study time
import sys
import os

# Add StudyTimeTracker to path
addons_path = os.path.dirname(__file__)
tracker_path = os.path.join(addons_path, 'StudyTimeTracker')

if tracker_path not in sys.path:
    sys.path.insert(0, tracker_path)

from ankiconnect_integration import get_study_time_handler, reset_study_time_handler

# These will be available to AnkiConnect
```

Then edit AnkiConnect's `__init__.py` to import and register these handlers.

**Option B: Manual Testing (Simple)**
For testing, you can manually check if it works:

1. Open Anki
2. Study some cards (at least 30 minutes)
3. Open a terminal and test:

```bash
curl -X POST http://localhost:8765 -d '{"action": "getStudyTime", "version": 6}'
```

If you see a result (time in milliseconds), it's working!

### 5. Verify Integration

1. **Start Anki** - Make sure Anki is running
2. **Study cards** - Review some Anki cards
3. **Check Firefox extension popup**:
   - Should show "Anki: XX:XX:XX ✗" (or ✓ if you have 30+ minutes)
   - Web and Anki time shown separately

## How It Works

### Time Tracking
- **Web tracking**: Counts time on HackTheBox/FreeCodeCamp
- **Anki tracking**: The add-on tracks active card review time
- **Combined**: Total = Web time + Anki time

### Goal Requirements
- Must complete **1 hour total study time**
- Must have **at least 30 minutes from Anki**
- Example valid completion:
  - 30 min Anki + 30 min HackTheBox = 1 hour ✓
  - 45 min Anki + 15 min FreeCodeCamp = 1 hour ✓

### Invalid Examples
- 60 min HackTheBox + 0 min Anki = ✗ (need 30m Anki)
- 25 min Anki + 35 min websites = ✗ (need 30m Anki)

### Cycle Reset
- Every 4 hours, both counters reset
- You must complete another 1 hour (including 30m Anki)

## Troubleshooting

**Extension shows "Anki: 00:00:00":**
- Make sure Anki is running
- Check AnkiConnect is installed
- Verify CORS settings allow `moz-extension://*`
- Try restarting Anki

**AnkiConnect not responding:**
- Check if Anki is open
- Verify AnkiConnect installed: Tools → Add-ons
- Check port 8765 is not blocked
- Try: `curl http://localhost:8765` (should get a response)

**Study time not tracking:**
- Make sure you're actively reviewing cards (not just browsing)
- Pauses after 5 seconds of inactivity
- Check add-on is enabled in Tools → Add-ons
- Restart Anki

**"Need 30m Anki" always showing:**
- Study at least 30 minutes in Anki
- Check the popup shows increasing Anki time
- The ✓ appears after 30 minutes

## Without Anki

If you don't want to use Anki:
- You can still use the extension
- It will just require 1 hour on HackTheBox/FreeCodeCamp
- Anki time will show 00:00:00
- You won't be able to unlock until Anki requirement is met

To disable Anki requirement completely, you'd need to modify the extension code.
