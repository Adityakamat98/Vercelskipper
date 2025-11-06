# Icon Placeholder

Since image creation tools are not available in this environment, you'll need to add icons manually.

## Option 1: Use Online Icon Generators

1. Visit https://www.favicon-generator.org/ or similar
2. Create or upload a simple icon (blue background with white "V" works well)
3. Download these sizes: 16x16, 48x48, 128x128
4. Rename them to: `icon16.png`, `icon48.png`, `icon128.png`
5. Place them in the extension folder

## Option 2: Use Vercel's Colors

Create simple PNG icons with Vercel's brand colors:
- Background: #0070f3 (Vercel blue)
- Text/Symbol: White

## Option 3: Remove Icons Temporarily

Edit `manifest.json` and remove the `icons` section:

```json
{
  "manifest_version": 3,
  "name": "Vercel: Skip Deployment Checks",
  "version": "1.0",
  "description": "One-click skipping for all deployment checks on vercel.com.",
  "permissions": ["scripting", "activeTab"],
  "action": {
    "default_popup": "popup.html",
    "default_title": "Skip Vercel Deployment Checks"
  },
  "host_permissions": [
    "https://vercel.com/*"
  ]
}
```

The extension will work fine without custom icons - Chrome will use a default icon.
