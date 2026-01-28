# X Reposter Firefox Extension

A local-only Firefox WebExtension for automated reposting on X.com (Twitter).

## Installation Instructions

### 1. Load Extension in Firefox

1. Open Firefox
2. Navigate to `about:debugging`
3. Click "This Firefox" in the left sidebar
4. Click "Load Temporary Add-on..."
5. Navigate to the extension folder and select `manifest.json`
6. The extension will appear in your toolbar

### 2. Alternative Method (Developer Mode)

1. Open Firefox
2. Navigate to `about:addons`
3. Click the gear icon (⚙️) and select "Debug Add-ons"
4. Click "Load Temporary Add-on..."
5. Select the `manifest.json` file

## Usage Instructions

### Setup
1. Log into your X.com account manually
2. Click the extension icon in Firefox toolbar
3. Configure hashtags (one per line, e.g., `#crypto`, `#bitcoin`)
4. Set delay between actions (minimum 3 seconds recommended)
5. Click "Save Settings"

### Operation
1. Navigate to X.com search results for your target hashtags
2. Click the extension icon
3. Click "Start Auto-Repost" to begin automation
4. Click "Stop" to halt the process anytime

## Features

- **Local-only**: No external servers or API keys required
- **Safety delays**: Configurable delays between actions (3-60 seconds)
- **Manual control**: Start/Stop functionality
- **Hashtag filtering**: Only reposts tweets containing specified hashtags
- **Duplicate prevention**: Tracks processed tweets to avoid duplicates
- **Human-like behavior**: Smooth scrolling and realistic timing

## Technical Details

### File Structure
```
XExtention/
├── manifest.json       # Extension configuration
├── popup.html         # Extension popup interface
├── popup.js          # Popup logic and settings
├── background.js     # Background script
├── content.js        # Main reposting logic
└── README.md         # This file
```

### Browser Compatibility
- Firefox 57+ (WebExtensions API)
- Tested on macOS and Windows

## Safety Features

- **Rate limiting**: Configurable delays prevent rapid-fire actions
- **Manual override**: Stop button immediately halts all activity
- **Scroll-based loading**: Naturally loads more content
- **Error handling**: Graceful failure recovery
- **No API abuse**: Uses only DOM interaction, no Twitter API

## Limitations

- Requires manual login to X.com
- Works only on search result pages
- DOM selectors may need updates if X.com changes their structure
- Temporary extension (reloads on Firefox restart)

## Troubleshooting

### Extension Not Working
1. Ensure you're logged into X.com
2. Navigate to search results page (not timeline)
3. Check browser console for errors (F12 → Console)
4. Reload the extension in `about:debugging`

### No Tweets Being Processed
1. Verify hashtags are configured correctly
2. Ensure search results contain target hashtags
3. Check that tweets are visible on page
4. Try scrolling manually to load more content

### Repost Button Not Found
1. X.com may have updated their DOM structure
2. Check browser console for error messages
3. Manually verify repost buttons are visible

## Development Notes

- Uses WebExtensions API (Manifest V2 for Firefox compatibility)
- Content script runs on x.com and twitter.com domains
- Storage API persists settings between sessions
- Message passing between popup and content script

## Legal and Ethical Considerations

- Respect X.com Terms of Service
- Use reasonable delays to avoid spam detection
- Only repost content you have rights to share
- Monitor your account for any platform restrictions
- This tool is for personal use only

## Updates

To update the extension:
1. Modify the source files
2. Reload the extension in `about:debugging`
3. No need to reinstall unless manifest.json changes