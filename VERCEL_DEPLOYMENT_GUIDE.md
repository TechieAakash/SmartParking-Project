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
- **Framework Preset**: **Other** (or **Express**)
- **Build Command**: Leave empty.
- **Output Directory**: Leave empty.
- **Install Command**: `npm install` 
  > [!IMPORTANT]
  > **DO NOT use backticks (`)** in the Vercel input box. Type it exactly as `npm install`.

## 4. Why this configuration works
-   **`vercel.json`**: Tells Vercel to route any `/api/*` requests to your root `index.js`.
-   **Root `index.js`**: Bridges the serverless environment with your Express app.
-   **`.vercelignore`**: Ensures only necessary files are uploaded.

## 5. Free Cloud MySQL Databases
Since you cannot use `localhost`, here are the best free-tier providers:
-   **[Aiven.io](https://aiven.io/mysql)**: Highly recommended, very easy setup.
-   **[TiDB Cloud](https://pingcap.com/products/tidb-cloud)**: Great MySQL-compatible serverless DB.

### Setup Steps:
1.  Create a MySQL instance on one of the above.
2.  Get the **Host**, **User**, **Password**, and **Database Name**.
3.  Update these in **Vercel Project Settings > Environment Variables**.
4.  **Redeploy** the latest commit.

---
**Need help?** Ask me to verify a specific configuration!
