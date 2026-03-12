# Seekairos — Deployment Guide

## Project Structure
```
seekairos/
├── netlify.toml                  ← Netlify configuration
├── netlify/
│   └── functions/
│       └── chat.js               ← Secure API proxy (your keys live here)
└── public/
    ├── index.html                ← Main website (seekairos.com)
    ├── fx-assistant.html         ← FX Regulation Assistant app
    ├── manifest.json             ← PWA manifest (mobile install)
    └── sw.js                     ← Service worker (offline support)
```

---

## Step 1 — Deploy to Netlify (10 minutes)

1. Go to **netlify.com** → Sign up free
2. Click **"Add new site"** → **"Deploy manually"**
3. Drag the entire `seekairos/` folder onto the Netlify deploy zone
4. Netlify gives you a URL like `seekairos.netlify.app` — your site is live!

---

## Step 2 — Add Your API Keys (2 minutes)

In Netlify Dashboard:
1. Go to **Site Settings** → **Environment Variables**
2. Add these variables:

| Key | Value |
|-----|-------|
| `NVIDIA_API_KEY` | `nvapi-...` (your NVIDIA key) |
| `ANTHROPIC_API_KEY` | `sk-ant-...` (optional backup) |

3. Click **Deploy** → **Trigger deploy** to apply the keys

---

## Step 3 — Connect seekairos.com (30 minutes)

1. In Netlify: **Domain Management** → **Add custom domain** → type `seekairos.com`
2. Netlify shows you nameservers (e.g. `dns1.p01.nsone.net`)
3. Go to your domain registrar (wherever you bought seekairos.com)
4. Update the nameservers to the ones Netlify provided
5. Wait 15–60 minutes for DNS to propagate
6. Netlify automatically adds free SSL (HTTPS) ✓

Your URLs will be:
- `https://seekairos.com` → Website
- `https://seekairos.com/fx-assistant` → FX Assistant App

---

## Step 4 — Mobile App (PWA) — Automatic!

Once deployed, the PWA is automatic:

**Android (Chrome):**
- Visit `seekairos.com/fx-assistant` on Chrome
- Chrome shows "Add to Home Screen" banner automatically
- Tap install → app icon appears on home screen

**iOS (Safari):**
- Visit `seekairos.com/fx-assistant` on Safari
- Tap the Share button (□↑)
- Tap "Add to Home Screen"
- Tap Add → app icon appears

Users get a full-screen app experience with offline support — no App Store needed.

---

## Step 5 — Connect Contact Form (15 minutes)

1. Go to **formspree.io** → create free account
2. Create a new form → copy your form endpoint (e.g. `https://formspree.io/f/xabcdefg`)
3. In `public/index.html`, find the `<form id="waitlistForm">` tag
4. Add `action="https://formspree.io/f/YOUR_ID"` and `method="POST"`
5. Redeploy → form submissions arrive in your email

---

## Future: Native Mobile App

When ready to publish to App Store / Google Play:
- Use **React Native** or **Capacitor** to wrap the web app
- Apple Developer Account: $99/year
- Google Play Developer: $25 once
- Estimated timeline: 4–8 weeks with developer help

---

## Support
Built by Seekairos · seekairos.com
