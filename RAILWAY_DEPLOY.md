# Railway Deployment Guide - SmartParking

## Quick Deployment Steps

### 1. Create Railway Project
1. Go to [Railway](https://railway.app) and log in
2. Click **New Project** → **Deploy from GitHub repo**
3. Select the `TechieAakash/SmartParking-Project` repository

### 2. Add MySQL Database
1. In your Railway project, click **+ New** → **Database** → **MySQL**
2. Railway will create a MySQL instance with these auto-configured variables:
   - `MYSQLHOST`
   - `MYSQLPORT`
   - `MYSQLDATABASE`
   - `MYSQLUSER`
   - `MYSQLPASSWORD`
   - `MYSQL_URL`

### 3. Set Environment Variables
Add these variables in the backend service's **Variables** tab:

| Variable | Value | Notes |
|----------|-------|-------|
| `NODE_ENV` | `production` | Required |
| `PORT` | `${{PORT}}` | Railway provides this |
| `JWT_SECRET` | `your-strong-secret-key` | **Required** - Use a strong random string |
| `OPENAI_API_KEY` | `your-openai-key` | For Kuro chatbot |
| `GEMINI_API_KEY` | `your-gemini-key` | Optional - for AI features |
| `CORS_ORIGIN` | `*` or your frontend URL | Controls API access |

> **Important:** Railway auto-links MySQL variables. Just add the service variables above.

> **For Render Frontend Integration:** Set `CORS_ORIGIN` to your Render frontend URL (e.g., `https://smartparking-frontend.onrender.com`) to allow API requests from the frontend.

### 4. Database Initialization
The application will automatically:
- Connect to the MySQL database using Railway's environment variables
- Create tables using Sequelize ORM
- Seed initial data (admin user, parking zones, etc.)

**Default Admin Credentials:**
- Email: `admin@smartparking.com`
- Password: `admin123`

### 5. Connect Frontend
For the frontend, you have two options:

**Option A: Static Hosting (Recommended)**
1. Deploy `frontend/` folder to Railway Static, Vercel, or Netlify
2. Update API calls to point to your Railway backend URL

**Option B: Serve from Backend**
The backend already serves static files from the `frontend/` directory.

---

## Environment Variable Reference

### Railway MySQL (Auto-provided)
```
MYSQLHOST - Database host (provided by Railway)
MYSQLPORT - Database port (3306)
MYSQLDATABASE - Database name (railway)
MYSQLUSER - Database user (root)
MYSQLPASSWORD - Database password (auto-generated)
```

### Application Variables (Manual)
```
NODE_ENV=production
PORT=${{PORT}}
JWT_SECRET=your-super-secret-key
JWT_EXPIRE=7d
CORS_ORIGIN=*
OPENAI_API_KEY=your-key
GEMINI_API_KEY=your-key
```

---

## Troubleshooting

### Database Connection Failed
- Verify MySQL service is running in Railway
- Check that your backend service is linked to MySQL
- Variables should auto-populate when services are linked

### Application Won't Start
- Check build logs in Railway dashboard
- Verify all required environment variables are set
- Ensure `package.json` has correct start script

### API Not Accessible
- Check the deployment URL in Railway
- Verify CORS settings allow your frontend origin
- Check application logs for errors

---

## Files Created for Railway

| File | Purpose |
|------|---------|
| `nixpacks.toml` | Build configuration for Railway |
| `Procfile` | Process startup command |
| `.env.example` | Environment variable template |

---

## Support

If you encounter issues, check:
1. Railway Dashboard → Your Project → Logs
2. Database panel for connection status
3. Build logs for deployment errors
