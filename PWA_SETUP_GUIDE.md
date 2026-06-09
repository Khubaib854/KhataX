# PWA Setup Guide for KhataX

Your project has been successfully converted to a Progressive Web App (PWA)! Here's what was configured:

## ✅ What's Been Configured

### 1. **Service Worker**
- Auto-generated and automatically registered in your app
- Handles offline caching with network-first strategy for HTML
- Caches assets for faster loading
- Located at: `/public/sw.js` (auto-generated during build)

### 2. **Web App Manifest**
- Defines app metadata (name, icons, colors, display mode)
- Allows installation on home screens
- Located at: `/public/manifest.json`

### 3. **Vite Plugin PWA**
- Integrated `vite-plugin-pwa` for automatic PWA features
- Auto-updates service worker when app changes
- Generates manifest and workbox configuration

### 4. **HTML Meta Tags**
- Added PWA-specific meta tags in `index.html`
- Supports iOS app-like appearance
- Apple Touch Icon configuration

### 5. **Service Worker Registration**
- Automatically registered in `/src/main.tsx`
- Works in production and development

## 🎨 Next Steps: Add Icons

You need to add app icons to make the PWA installable. Create these images in the `/public` folder:

### Required Icon Files:
```
public/
├── icon-192.png           (192x192 pixels)
├── icon-512.png           (512x512 pixels)
├── icon-192-maskable.png  (192x192 pixels, with safe area)
├── icon-512-maskable.png  (512x512 pixels, with safe area)
├── screenshot-1.png       (540x720 pixels, narrow view)
└── screenshot-2.png       (1280x720 pixels, wide view)
```

### How to Generate Icons:
1. **Using Online Tools:**
   - [PWA Asset Generator](https://tomayac.github.io/pwa-asset-generator/)
   - [Favicon Generator](https://realfavicongenerator.net/)

2. **Using CLI:**
   ```bash
   npm install -g pwa-asset-generator
   pwa-asset-generator icon.png ./public --splash-only --type png
   ```

3. **Important for Maskable Icons:**
   - Keep important content in the center
   - Ensure content is within a circle of diameter 80% of the image
   - Use transparent background for PWA icon purposes

## 📱 How to Test Your PWA

### On Desktop (Chrome/Edge):
1. Run `npm run build`
2. Deploy to HTTPS (required for PWA)
3. Open in Chrome or Edge
4. Click the install button (should appear in the address bar)
5. Or: Right-click → "Install app"

### On Mobile:
1. Open the app in a mobile browser
2. Tap share/menu → "Add to Home Screen" (iOS) or similar
3. Or open in Chrome on Android and look for install prompt

### Test Offline Support:
1. Open DevTools (F12)
2. Go to Application → Service Workers
3. Check "Offline" checkbox
4. Reload the page
5. The app should still work with cached content

## 📊 Manifest Configuration

Your `manifest.json` includes:
- **Name**: "KhataX - Accounting Made Simple"
- **Display**: Standalone (full-screen app, no browser UI)
- **Theme Color**: #1f2937 (dark gray)
- **Background Color**: White
- **Start URL**: / (root of your app)
- **Categories**: Business, Productivity

## 🔄 Caching Strategy

- **HTML**: Network-first (try network, fallback to cache)
- **Assets (JS/CSS/Images)**: Cache-first (use cache, fallback to network)
- **External URLs**: Network-first with 1-day cache expiration

## 🚀 Production Deployment

For the PWA to be installable in production:

1. **HTTPS Required** - PWA only works over HTTPS
2. **Valid Manifest** - Ensure all icon files exist
3. **Service Worker** - Must be registered (already done)
4. **Responsive Design** - Your Tailwind CSS setup is perfect

## 📝 Key Files Modified/Created

- ✅ `vite.config.ts` - Added VitePWA plugin
- ✅ `index.html` - Added PWA meta tags and manifest link
- ✅ `src/main.tsx` - Added Service Worker registration
- ✅ `public/manifest.json` - Web app manifest
- ✅ `package.json` - Added vite-plugin-pwa dependency

## 🐛 Troubleshooting

### PWA not installing?
- Ensure you have HTTPS (or localhost)
- Check if all required icons exist
- Verify manifest.json is valid (check DevTools)
- Check Application → Manifest in DevTools

### Service Worker not updating?
- Hard refresh (Ctrl+Shift+R)
- Clear cache in DevTools
- Service Workers may take a few minutes to update

### Icons not showing?
- Verify icon files exist in `/public` folder
- Check file paths in manifest.json
- Ensure icons are valid PNG files
- Test with 192x192 and 512x512 at minimum

## 📚 Resources

- [PWA Checklist](https://web.dev/pwa-checklist/)
- [Manifest Specification](https://www.w3.org/TR/appmanifest/)
- [Service Worker Docs](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API)
- [vite-plugin-pwa Docs](https://vite-plugin-pwa.netlify.app/)

## 🎉 You're Ready!

Your app is now a PWA! Once you add icons and deploy to HTTPS, users will be able to:
- Install the app on their home screen
- Use it offline
- Receive updates automatically
- Get a native app-like experience
