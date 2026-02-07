# Railway MySQL Connection Guide for Express Backend

## ✅ Configuration Complete

Your Express backend is now configured to connect to Railway MySQL using `MYSQL_URL`.

---

## 🔧 Changes Made

### 1. Database Connection (`backend/src/config/database.js`)

**Uses Railway's `MYSQL_URL`:**
```javascript
if (process.env.MYSQL_URL) {
  sequelize = new Sequelize(process.env.MYSQL_URL, {
    dialect: 'mysql',
    pool: { max: 10, min: 0, acquire: 30000, idle: 10000 },
    // ... other config
  });
}
```

**Benefits:**
- ✅ Automatic connection to Railway MySQL
- ✅ No manual host/port/user/password configuration needed
- ✅ Falls back to individual env vars for local development

---

### 2. Server Port (`backend/src/server.js`)

**Uses Railway's `PORT`:**
```javascript
const PORT = process.env.PORT || config.port;
server = app.listen(PORT, '0.0.0.0', () => {
  // Railway assigns dynamic port
});
```

**Important:**
- Railway automatically sets `PORT` environment variable
- Binding to `0.0.0.0` allows external access
- No hardcoded port numbers

---

### 3. CORS Setup (`backend/src/app.js`)

**Dynamic CORS based on environment:**
```javascript
const allowedOrigins = process.env.CORS_ORIGIN 
  ? process.env.CORS_ORIGIN.split(',').map(origin => origin.trim())
  : ['*'];
```

**Set in Railway:**
```
CORS_ORIGIN=https://your-frontend.onrender.com
```

Or allow multiple frontends:
```
CORS_ORIGIN=https://your-frontend.onrender.com,https://another-frontend.com
```

---

## 🚀 Railway Environment Variables

Railway **auto-provides** these MySQL variables:

| Variable | Description | Auto-provided |
|----------|-------------|---------------|
| `MYSQL_URL` | Complete connection string | ✅ Yes |
| `MYSQLHOST` | Database host | ✅ Yes |
| `MYSQLPORT` | Database port (3306) | ✅ Yes |
| `MYSQLDATABASE` | Database name (railway) | ✅ Yes |
| `MYSQLUSER` | Database user (root) | ✅ Yes |
| `MYSQLPASSWORD` | Database password | ✅ Yes |
| `PORT` | Server port | ✅ Yes |

**You need to manually add:**

| Variable | Example Value | Required |
|----------|---------------|----------|
| `NODE_ENV` | `production` | ✅ Yes |
| `JWT_SECRET` | `your-strong-secret-key` | ✅ Yes |
| `CORS_ORIGIN` | `https://your-frontend.onrender.com` | ✅ Yes |
| `OPENAI_API_KEY` | `sk-...` | ⚠️ Optional |
| `GEMINI_API_KEY` | `AI...` | ⚠️ Optional |

---

## 📋 Railway Deployment Checklist

### Step 1: Verify MySQL Service
- [ ] MySQL service is running in Railway
- [ ] Services are linked (backend ↔ MySQL)
- [ ] Check "Variables" tab shows `MYSQL_URL`

### Step 2: Add Required Variables
In Railway backend service → Variables:

```bash
NODE_ENV=production
JWT_SECRET=your-super-strong-secret-key-change-this
CORS_ORIGIN=https://your-frontend.onrender.com
```

### Step 3: Deploy
- [ ] Push latest code to GitHub
- [ ] Railway auto-deploys from GitHub
- [ ] Check deployment logs for success

### Step 4: Verify Connection
Check Railway logs for:
```
✅ Database connection established successfully
📊 Connected to: railway@...
🚂 Railway Environment: production
```

---

## 🧪 Testing the Connection

### 1. Health Check
```bash
curl https://your-backend.railway.app/api/health
```

Expected response:
```json
{
  "success": true,
  "status": "UP",
  "timestamp": "2026-01-21T..."
}
```

### 2. Test Database Connection
Railway logs should show:
```
🔗 Connecting to Railway MySQL using MYSQL_URL
✅ Database connection established successfully
📊 Connected to: railway@...
```

### 3. Test CORS
From your Render frontend console:
```javascript
fetch('https://your-backend.railway.app/api/health')
  .then(r => r.json())
  .then(console.log);
```

Should NOT show CORS error.

---

## 🔍 Troubleshooting

### Error: "Unable to connect to database"

**Check:**
1. MySQL service is running in Railway
2. Services are properly linked
3. `MYSQL_URL` exists in Variables tab

**Fix:**
- Ensure backend and MySQL are in same project
- Click "Link" in Railway dashboard

---

### Error: "CORS blocked"

**Check:**
```
⚠️ CORS blocked origin: https://your-frontend.onrender.com
```

**Fix:**
Update Railway variable:
```
CORS_ORIGIN=https://your-frontend.onrender.com
```

Restart service after updating.

---

### Error: "Port already in use"

**This shouldn't happen on Railway.**

If it does:
- Railway manages ports automatically
- Ensure code uses `process.env.PORT`
- Check logs for actual error

---

### Database not seeding

**Check logs for:**
```
🌱 Seeding initial data...
👤 Creating users...
✅ Standard accounts created
```

**If missing:**
- Database might already have data
- Or seeding failed (check full logs)

**Manual seed:**
Run this in Railway shell:
```bash
node backend/scripts/seed.js
```

---

## 📊 Connection Flow

```
┌─────────────────────┐
│  Render Frontend    │
│  (Static Files)     │
└──────────┬──────────┘
           │
           │ HTTPS Requests
           │ (CORS enabled)
           ▼
┌─────────────────────┐
│  Railway Backend    │
│  Express Server     │
│  PORT: Dynamic      │
└──────────┬──────────┘
           │
           │ MYSQL_URL
           │ (Auto-connected)
           ▼
┌─────────────────────┐
│  Railway MySQL      │
│  Database: railway  │
└─────────────────────┘
```

---

## 🎯 Production Best Practices

### Security
- ✅ Never hardcode credentials
- ✅ Use strong `JWT_SECRET` (32+ characters)
- ✅ Restrict CORS to specific frontend URL
- ✅ Enable HTTPS (Railway does this automatically)

### Performance
- ✅ Connection pooling enabled (max: 10)
- ✅ Database indexes (handled by schema)
- ✅ Disable SQL logging in production

### Monitoring
- ✅ Check Railway logs regularly
- ✅ Monitor database metrics
- ✅ Set up error alerts (Railway Pro)

---

## 🔄 Making Updates

**Update backend code:**
```bash
git add backend/
git commit -m "Update backend"
git push origin main
```

Railway auto-deploys from GitHub.

**Update environment variables:**
1. Railway Dashboard → Backend Service
2. Variables tab → Edit
3. Save (triggers redeployment)

---

## ✅ Success Indicators

Your Railway backend is working correctly if you see:

✅ Deployment status: "Success"  
✅ Logs show: "✅ Database connection established"  
✅ Health endpoint returns `{"success": true}`  
✅ Frontend can make API calls without CORS errors  
✅ Login/Registration works from frontend  

---

## 🆘 Need Help?

1. **Check Railway Logs**: Dashboard → Your Service → Logs
2. **Check Database**: Dashboard → MySQL → Data
3. **Test API directly**: Use Postman/curl
4. **Verify variables**: Variables tab shows all required vars

---

## 📚 Related Files

- [`backend/src/config/database.js`](file:///c:/Users/AAKASH/OneDrive/Desktop/folder12/backend/src/config/database.js) - Database connection
- [`backend/src/config/env.js`](file:///c:/Users/AAKASH/OneDrive/Desktop/folder12/backend/src/config/env.js) - Environment config
- [`backend/src/app.js`](file:///c:/Users/AAKASH/OneDrive/Desktop/folder12/backend/src/app.js) - CORS setup
- [`backend/src/server.js`](file:///c:/Users/AAKASH/OneDrive/Desktop/folder12/backend/src/server.js) - Server startup

---

Your backend is now **Railway-ready**! 🚂✨
