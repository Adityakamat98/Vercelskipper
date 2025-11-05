# Vercel Deployment Checks Skipper

A Chrome extension that automates skipping deployment checks on Vercel.com with a single click.

## Features

- ✨ One-click operation to skip all deployment checks
- 🎯 Automatically finds and opens the "Deployment Checks" section
- ⚡ Clicks all available "Skip" buttons sequentially
- 📝 Detailed console logging for transparency
- 🔒 Only works on vercel.com for security

## Installation

### Loading the Extension (Sideload)

1. **Open Chrome Extensions Page**
   - Navigate to `chrome://extensions/` in your Chrome browser
   - Or click Menu (⋮) → Extensions → Manage Extensions

2. **Enable Developer Mode**
   - Toggle the "Developer mode" switch in the top-right corner

3. **Load the Extension**
   - Click "Load unpacked" button
   - Select the `Vercelskipper` folder containing the extension files

4. **Verify Installation**
   - The extension should appear in your extensions list
   - Pin it to your toolbar for easy access (click the puzzle icon and pin)

## Usage

1. **Navigate to a Vercel deployment page**
   - Go to any deployment on vercel.com that has deployment checks

2. **Click the extension icon**
   - Find the extension in your Chrome toolbar
   - Click to open the popup

3. **Click "Skip All Checks"**
   - The extension will automatically:
     - Find the Deployment Checks section
     - Open it if needed
     - Click all available Skip buttons
   - Check the browser console (F12) for detailed logs

## File Structure

```
Vercelskipper/
├── manifest.json       # Extension configuration
├── popup.html         # Extension popup UI
├── popup.js           # Popup logic and script injection
├── content.js         # Main automation script
├── icon16.png         # Extension icon (16x16)
├── icon48.png         # Extension icon (48x48)
├── icon128.png        # Extension icon (128x128)
└── README.md          # This file
```

## How It Works

### Architecture

1. **popup.html/popup.js**: Provides the user interface and handles the button click
2. **content.js**: Contains the main automation logic that runs on the Vercel page

### Process Flow

1. User clicks "Skip All Checks" button
2. Extension validates the current tab is on vercel.com
3. `content.js` is injected into the active tab
4. Script locates the "Deployment Checks" section
5. Opens the section if it's closed
6. Finds all enabled "Skip" buttons
7. Clicks each button with a delay between clicks
8. Logs progress to the console

### Configuration

The `content.js` file contains a `CONFIG` object with customizable settings:

```javascript
const CONFIG = {
  SELECTORS: { ... },    // CSS selectors for page elements
  TEXT: { ... },         // Text identifiers
  DELAYS: { ... },       // Timing delays in milliseconds
  STATE: { ... }         // State attribute values
};
```

You can adjust these values if Vercel's UI changes or to fine-tune the timing.

## Troubleshooting

### Extension not working?

1. **Check you're on vercel.com**
   - The extension only works on Vercel deployment pages

2. **Refresh the page**
   - Sometimes a page refresh helps

3. **Check the console**
   - Press F12 to open DevTools
   - Look for `[Vercel Skipper]` messages

4. **Verify permissions**
   - Make sure the extension has access to vercel.com

### Common Issues

- **"No skip buttons found"**: The deployment checks may not be loaded yet, or there are no checks to skip
- **Section not opening**: The page structure may have changed; check the console for retry messages
- **Nothing happens**: Check that JavaScript is enabled and the page has fully loaded

## Development

### Making Changes

1. Edit the source files as needed
2. Go to `chrome://extensions/`
3. Click the reload icon (🔄) on the extension card
4. Test your changes

### Updating Selectors

If Vercel changes their UI, you may need to update the CSS selectors in `content.js`:

1. Open DevTools on a Vercel deployment page
2. Inspect the elements you need to target
3. Update the `CONFIG.SELECTORS` object in `content.js`
4. Reload the extension

## Notes

- The extension adds delays between actions to ensure reliability
- All actions are logged to the console for debugging
- The extension only skips checks that are already loaded on the page

## License

Free to use and modify for personal or commercial purposes.

## Version History

- **1.0** - Initial release
  - Core functionality to skip deployment checks
  - Clean, commented, and scalable code structure
  - Error handling and user feedback