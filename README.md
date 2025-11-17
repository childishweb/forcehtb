# Study Time Enforcer - Firefox Extension

A Firefox extension that helps you stay focused on your study goals by blocking all websites until you spend 1 hour on HackTheBox or FreeCodeCamp.

## Features

- **Smart Time Tracking**: Automatically tracks time spent on goal websites (HackTheBox and FreeCodeCamp)
- **Site Blocking**: Blocks all other websites until you complete 1 hour of study time
- **Visual Progress**: Beautiful popup interface showing your study progress
- **Persistent Tracking**: Your progress is saved even if you close the browser
- **Auto-Unlock**: All websites automatically unlock after completing 1 hour of study time
- **Reset Option**: Manually reset your progress if needed

## Goal Websites

The extension tracks study time on:
- HackTheBox (hackthebox.com, app.hackthebox.com, hackthebox.eu)
- FreeCodeCamp (freecodecamp.org, www.freecodecamp.org)

## Installation

### Method 1: Temporary Installation (for testing)

1. Open Firefox and navigate to `about:debugging#/runtime/this-firefox`
2. Click "Load Temporary Add-on..."
3. Navigate to the extension directory and select the `manifest.json` file
4. The extension will be loaded and active until Firefox is restarted

### Method 2: Permanent Installation (unsigned)

1. Open Firefox and navigate to `about:config`
2. Search for `xpinstall.signatures.required` and set it to `false`
3. Package the extension:
   ```bash
   cd /path/to/extension
   zip -r study-time-enforcer.xpi manifest.json background.js popup.html popup.js popup.css icons/
   ```
4. Open Firefox and navigate to `about:addons`
5. Click the gear icon and select "Install Add-on From File..."
6. Select the `study-time-enforcer.xpi` file

### Method 3: Developer Edition (recommended for development)

1. Download and install [Firefox Developer Edition](https://www.mozilla.org/en-US/firefox/developer/)
2. Follow Method 1 above - Developer Edition allows unsigned extensions permanently

## How It Works

1. **Start Studying**: Navigate to HackTheBox or FreeCodeCamp and start learning
2. **Time Tracking**: The extension automatically tracks your active time on these sites
3. **Progress Monitoring**: Click the extension icon to see your progress
4. **Unlock**: After 1 hour of study time, all websites are unlocked
5. **Reset**: Use the reset button in the popup to start over

## Usage Tips

- The extension only tracks time when you're actively on a goal website tab
- Switching tabs or minimizing the browser pauses time tracking
- Your progress is saved automatically every 5 seconds
- Time is tracked per browsing session and accumulated until the goal is reached

## File Structure

```
.
├── manifest.json          # Extension manifest
├── background.js          # Background script for time tracking and blocking
├── popup.html            # Popup interface HTML
├── popup.js              # Popup interface logic
├── popup.css             # Popup interface styles
└── icons/                # Extension icons
    ├── icon-16.png
    ├── icon-32.png
    ├── icon-48.png
    └── icon-128.png
```

## Technical Details

### Permissions

- `webRequest`: To intercept and block navigation requests
- `webRequestBlocking`: To block requests in real-time
- `<all_urls>`: To monitor all website visits
- `storage`: To persist study time progress
- `tabs`: To track active tabs and URLs

### Browser Compatibility

- Firefox 57+ (Manifest V2)
- Not compatible with Chrome (uses Firefox-specific APIs)

## Privacy

This extension:
- Does NOT collect any personal data
- Does NOT send any data to external servers
- Stores all data locally in your browser
- Only tracks time spent on goal websites

## Troubleshooting

**Extension not blocking sites:**
- Make sure the extension is enabled in `about:addons`
- Check that you haven't reached the 1-hour goal yet
- Try restarting Firefox

**Time not tracking:**
- Ensure you're on the actual goal website (not just a bookmark or new tab)
- Check that the tab is active and focused
- Look for the "Studying Now..." status in the popup

**Want to reset progress:**
- Click the extension icon
- Click the "Reset Progress" button
- Confirm the reset

## Development

To modify the extension:

1. Edit the source files
2. If using temporary installation, click "Reload" in `about:debugging`
3. Test your changes

## License

MIT License - feel free to modify and distribute

## Contributing

Contributions are welcome! Feel free to submit issues or pull requests.
