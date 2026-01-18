# 🚀 Vercel Deployment Guide

This project is optimized for deployment on **Vercel** as a monorepo. Follow these steps to get your Smart Parking System live.

## 1. Import Project to Vercel
1.  Push your latest local changes to GitHub (I have already done this for you).
2.  Go to [vercel.com](https://vercel.com) and click **"Add New"** > **"Project"**.
3.  Import your repository: `TechieAakash/SmartParking-Project`.
-   **Framework Preset**: Keep it as **Other**.
-   **Node.js Version**: Ensure it uses **24.x** (I have already updated `package.json` to 24.x for you).
-   **Root Directory**: Keep it as **`./`**.

## 2. Environment Variables (CRITICAL)
> [!WARNING]
> **DB_HOST cannot be `localhost`**: In a Vercel deployment, `localhost` refers to the Vercel server itself, not your computer. You **MUST** use a cloud-hosted MySQL database.

| Key | Value | Note |
| :--- | :--- | :--- |
| `DB_HOST` | `your-cloud-db.com` | **DO NOT USE localhost**. Use Aiven, Tidb, or AWS. |
| `DB_USER` | `admin` | Your remote DB username. |
| `DB_PASSWORD` | `your_secure_password` | Your remote DB password. |
| `DB_NAME` | `smartparking` | Database name. |
| `DB_PORT` | `3306` | Default MySQL port. |
| `JWT_SECRET` | `any-random-long-string` | Used for securing logins. |
| `OPENAI_API_KEY` | `sk-proj-...` | Your OpenAI API key for Kuro AI. |
| `VERCEL` | `1` | (Optional) Already set in `vercel.json`. |

## 3. Deployment Settings
- **Build Command**: Leave empty (Vercel uses `vercel.json`).
- **Output Directory**: Leave empty.
- **Install Command**: `npm install` (Vercel will detect the root `package.json`).

## 4. Why this configuration works
-   **`vercel.json`**: Tells Vercel to route any `/api/*` requests to the serverless function in `api/index.js` and everything else to the `frontend` folder.
-   **`api/index.js`**: Bridges the serverless environment with your Express app logic.
-   **`.vercelignore`**: Ensures only necessary files are uploaded, speeding up builds.

## 5. Troubleshooting
-   **Database Errors**: Ensure your cloud MySQL database allows connections from Vercel's IP addresses (set Allow-All `0.0.0.0/0` if necessary).
-   **404 on API**: Double-check that your frontend `js/config.js` uses `/api` as the base URL relative to the domain.

---
**Need help?** Ask me to verify a specific configuration or check your environment variables!
