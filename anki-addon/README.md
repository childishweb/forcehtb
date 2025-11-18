# Study Time Tracker - Anki Add-on

An Anki add-on that tracks your study time and integrates with the Firefox Study Time Enforcer extension via AnkiConnect.

## Features

- Tracks active study time in Anki
- Saves progress across sessions
- Exposes study time via AnkiConnect API
- Stops tracking after 5 seconds of inactivity

## Installation

### 1. Install the Add-on

**Option A: Manual Installation**
1. Open Anki
2. Go to Tools → Add-ons → View Files
3. Copy the `StudyTimeTracker` folder into the add-ons directory
4. Restart Anki

**Option B: From .zip**
1. Zip the `StudyTimeTracker` folder
2. In Anki: Tools → Add-ons → Install from file
3. Select the zip file
4. Restart Anki

### 2. Install AnkiConnect (Required)

This add-on requires AnkiConnect to communicate with the Firefox extension.

1. In Anki: Tools → Add-ons → Get Add-ons
2. Enter code: `2055492159`
3. Restart Anki

### 3. Configure AnkiConnect

After installing AnkiConnect, you need to add custom actions:

1. Go to: Tools → Add-ons → AnkiConnect → Config
2. Add these custom actions to enable study time tracking:

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

### 4. Manual AnkiConnect Integration

To expose study time functions via AnkiConnect:

1. Open AnkiConnect's `__init__.py` file (in the add-ons folder)
2. Add this import at the top:
```python
from StudyTimeTracker.ankiconnect_integration import get_study_time_handler, reset_study_time_handler
```

3. In the AnkiConnect action handlers dictionary, add:
```python
'getStudyTime': get_study_time_handler,
'resetStudyTime': reset_study_time_handler,
```

4. Restart Anki

## How It Works

### Time Tracking
- Starts tracking when you view a card
- Continues tracking while you're active (answering cards)
- Pauses after 5 seconds of inactivity
- Saves progress every 5 seconds

### AnkiConnect API

Once configured, the extension can query:

**Get study time:**
```bash
curl -X POST http://localhost:8765 -d '{"action": "getStudyTime", "version": 6}'
```

**Reset study time:**
```bash
curl -X POST http://localhost:8765 -d '{"action": "resetStudyTime", "version": 6}'
```

## Integration with Firefox Extension

The Firefox Study Time Enforcer extension will:
1. Poll AnkiConnect every 5 seconds
2. Check your Anki study time
3. Require minimum 30 minutes in Anki
4. Count Anki time towards the 1-hour study goal

## Troubleshooting

**Time not tracking:**
- Make sure you're actively reviewing cards
- Check that the add-on is enabled in Tools → Add-ons
- Restart Anki

**AnkiConnect not responding:**
- Verify AnkiConnect is installed and running
- Check that Anki is open
- Try restarting Anki

**CORS errors:**
- Make sure you added `moz-extension://*` to AnkiConnect's CORS settings
- Restart Anki after changing config

## File Structure

```
StudyTimeTracker/
├── __init__.py                    # Main add-on code
├── ankiconnect_integration.py     # AnkiConnect handlers
├── manifest.json                  # Add-on metadata
└── config.json                    # Default configuration
```

## Privacy

- All data stored locally in Anki
- No external servers contacted
- Study time only accessible via localhost AnkiConnect API
