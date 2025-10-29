# Prime OPS - Vercel Deployment Guide

## 🚀 Quick Start

### Repository Structure
- **main** - Development branch (active development)
- **production** - Deployment branch (for Vercel)

---

## 📦 Vercel Deployment Steps

### 1. Sign Up / Login to Vercel
1. Go to [vercel.com](https://vercel.com)
2. Sign up or login with your GitHub account
3. Authorize Vercel to access your repositories

### 2. Import Your Project
1. Click **"Add New..."** → **"Project"**
2. Import from GitHub: `iampolok247/Prime_OPS`
3. Select the **production** branch for deployment

### 3. Configure Project Settings

#### Framework Preset
- Select: **Other** (or leave as detected)

#### Build & Output Settings
```
Build Command: cd web && npm install && npm run build
Output Directory: web/dist
Install Command: npm install
```

#### Root Directory
- Leave as root `/` (or set to `web` if needed)

### 4. Environment Variables
Add these in Vercel dashboard under **Settings** → **Environment Variables**:

**Frontend (web):**
```bash
VITE_API_BASE=https://your-backend-api-url.com
# or for testing with local backend:
# VITE_API_BASE=http://localhost:5001
```

**Note:** You'll need to deploy your backend API separately (Render, Railway, Heroku, etc.) and update `VITE_API_BASE` with the actual backend URL.

### 5. Deploy
1. Click **Deploy**
2. Wait for build to complete (~2-3 minutes)
3. Your app will be live at: `https://your-project-name.vercel.app`

---

## 🔄 Continuous Deployment

Vercel automatically deploys when you push to the **production** branch:

```bash
# Make changes in main branch
git checkout main
# ... make your changes ...
git add -A
git commit -m "Your changes"
git push origin main

# Merge to production for deployment
git checkout production
git merge main
git push origin production
# ✅ Vercel will auto-deploy!
```

---

## 🌐 Custom Domain (Optional)

1. Go to Vercel Dashboard → Your Project → **Settings** → **Domains**
2. Add your custom domain (e.g., `app.primeacademy.org`)
3. Update DNS records as instructed by Vercel
4. SSL certificate will be auto-generated

---

## 🔧 Backend Deployment (Required Separately)

Your backend API needs to be deployed separately. Recommended platforms:

### Option 1: Render.com (Recommended)
1. Go to [render.com](https://render.com)
2. Create new **Web Service**
3. Connect GitHub repo: `iampolok247/Prime_OPS`
4. Settings:
   - **Root Directory:** `api`
   - **Build Command:** `npm install`
   - **Start Command:** `node server.js`
   - **Environment:** Node
5. Add environment variables:
   ```
   MONGODB_URI=your_mongodb_connection_string
   JWT_SECRET=your_secret_key
   NODE_ENV=production
   ```

### Option 2: Railway.app
1. Go to [railway.app](https://railway.app)
2. New Project → Deploy from GitHub
3. Select `api` directory
4. Add environment variables
5. Deploy

### Option 3: Heroku
```bash
cd api
heroku create your-app-name
heroku config:set MONGODB_URI=your_mongodb_uri
heroku config:set JWT_SECRET=your_secret
git subtree push --prefix api heroku main
```

---

## 📝 Update Frontend API URL

After deploying backend, update Vercel environment variable:

1. Vercel Dashboard → Project → **Settings** → **Environment Variables**
2. Update `VITE_API_BASE` to your backend URL (e.g., `https://your-app.onrender.com`)
3. Redeploy from Vercel dashboard

---

## ✅ Verification Checklist

- [ ] Frontend deployed on Vercel
- [ ] Backend deployed on Render/Railway/Heroku
- [ ] Environment variables configured
- [ ] VITE_API_BASE points to correct backend URL
- [ ] Test login functionality
- [ ] Test API calls (leads, tasks, etc.)
- [ ] Check browser console for errors
- [ ] Verify MongoDB connection working

---

## 🐛 Troubleshooting

### Build Fails on Vercel
- Check build logs in Vercel dashboard
- Ensure `web/package.json` has all dependencies
- Verify build command is correct

### API Calls Failing
- Check `VITE_API_BASE` environment variable
- Ensure backend is running
- Check CORS settings in backend
- Verify MongoDB connection

### "Failed to fetch" errors
- Backend URL incorrect in `VITE_API_BASE`
- Backend not deployed or crashed
- CORS not configured properly

---

## 📧 Support

For issues, check:
1. Vercel deployment logs
2. Backend server logs
3. Browser console (F12)
4. Network tab for API calls

---

## 🎉 Success!

Once deployed, your app will be accessible at:
- **Frontend:** `https://your-project.vercel.app`
- **Backend:** `https://your-backend.onrender.com` (or other platform)

Share the frontend URL with your team! 🚀
