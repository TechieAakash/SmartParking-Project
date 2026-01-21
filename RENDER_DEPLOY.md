# Render Frontend Deployment Guide - SmartParking

## 🚀 Quick Deployment to Render

### Step 1: Connect GitHub Repository
1. Go to [Render Dashboard](https://dashboard.render.com/)
2. Click **New** → **Static Site**
3. Connect your GitHub account
4. Select repository: `TechieAakash/SmartParking-Project`

### Step 2: Configure Static Site

| Setting | Value |
|---------|-------|
| **Name** | `smartparking-frontend` (or your choice) |
| **Branch** | `main` |
| **Root Directory** | `frontend` |
| **Build Command** | Leave empty (static files only) |
| **Publish Directory** | `.` (current directory) |

### Step 3: Deploy
1. Click **Create Static Site**
2. Wait for deployment (usually takes 1-2 minutes)
3. Your site will be live at: `https://smartparking-frontend.onrender.com`

---

## 🔗 Connect to Railway Backend

After deploying your backend on Railway, you need to update the frontend configuration:

### Update Frontend API URL

1. **Get your Railway backend URL**:
   - Go to Railway Dashboard → Your Backend Service
   - Copy the public URL (e.g., `https://smartparking-backend-production.up.railway.app`)

2. **Update config.js**:
   - Edit `frontend/js/config.js`
   - Replace `YOUR-RAILWAY-BACKEND-URL` with your actual Railway URL:
   
   ```javascript
   const PRODUCTION_API_URL = 'https://your-actual-backend.railway.app/api';
   ```

3. **Commit and push** the change:
   ```bash
   git add frontend/js/config.js
   git commit -m "Update production API URL"
   git push origin main
   ```

4. **Render will auto-deploy** the updated frontend

---

## 🔧 Backend CORS Configuration

Ensure your Railway backend allows requests from Render:

**In Railway backend environment variables**, set:
```
CORS_ORIGIN=https://smartparking-frontend.onrender.com
```

Or allow all origins (for testing):
```
CORS_ORIGIN=*
```

---

## ✅ Verification Steps

1. **Open Frontend**: Visit your Render URL
2. **Check Console**: Open browser DevTools → Console
   - Should see: `🔗 API Mode: PRODUCTION`
   - Should see: `📡 API URL: https://your-backend.railway.app/api`
3. **Test Login**: Try logging in with default credentials:
   - Email: `admin@smartparking.com`
   - Password: `admin123`

---

## 📁 Files Created

| File | Purpose |
|------|---------|
| `_redirects` | SPA routing for Render |
| `render.yaml` | Render configuration |
| `config.js` (updated) | Auto-detect environment |

---

## 🐛 Troubleshooting

### Frontend Can't Connect to Backend
- Check CORS settings in Railway backend
- Verify Railway backend URL is correct in `config.js`
- Check Railway backend is running (not crashed)

### 404 Errors on Page Refresh
- Verify `_redirects` file exists in `frontend/` folder
- Check Render build logs

### Login Not Working
- Open browser console for error messages
- Verify backend database is seeded
- Check network tab for API response errors

---

## 🎯 Architecture Overview

```
┌─────────────────────┐
│   Render (Static)   │
│   Frontend Files    │ ← User visits here
│   HTML/CSS/JS       │
└──────────┬──────────┘
           │
           │ API Calls
           │ (fetch requests)
           │
           ▼
┌─────────────────────┐
│  Railway (Backend)  │
│   Node.js + MySQL   │ ← Handles all data
│   API Endpoints     │
└─────────────────────┘
```

---

## 📝 Next Steps After Deployment

1. Update `config.js` with your Railway backend URL
2. Test all major features (login, booking, zones)
3. Update default admin password
4. Configure custom domain (optional)
