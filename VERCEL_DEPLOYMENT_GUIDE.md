# Vercel Deployment Guide - Full Stack

## Overview
This guide covers deploying your full-stack app (React frontend + Express backend + PostgreSQL) to Vercel.

---

## **STEP 1: Set Up PostgreSQL Database**

### Option A: Vercel Postgres (Recommended - Easiest)
```bash
# 1. Install Vercel CLI if not already done
npm install -g vercel

# 2. Login to Vercel
vercel login

# 3. Link your project to Vercel
cd your-project
vercel link

# 4. Create Vercel Postgres database
vercel postgres create supplements-db

# 5. The CLI will generate DATABASE_URL automatically
```

### Option B: Supabase (Free tier available)
1. Go to https://supabase.com
2. Create a new project
3. Copy the PostgreSQL connection string
4. Format: `postgresql://[user]:[password]@[host]:[port]/[database]`

### Option C: Railway
1. Go to https://railway.app
2. Create new project → PostgreSQL
3. Copy connection URL

---

## **STEP 2: Set Up Environment Variables in Vercel**

1. Go to https://vercel.com/dashboard
2. Select your project
3. Settings → Environment Variables
4. Add these variables:

```
DATABASE_URL=postgresql://user:password@host:5432/database
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_PRIVATE_KEY=your_private_key
FIREBASE_CLIENT_EMAIL=your_client_email
FIREBASE_STORAGE_BUCKET=your_bucket.appspot.com
RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_KEY_SECRET=your_razorpay_key_secret
BREVO_API_KEY=your_brevo_api_key
FRONTEND_URL=https://your-domain.vercel.app
```

**Get sensitive keys from:**
- **Firebase**: Download JSON from Firebase Console → Project Settings
- **Razorpay**: Dashboard → Settings → API Keys
- **Brevo**: Account Settings → API Keys

---

## **STEP 3: Prepare Your Project Structure**

Your backend structure should be:
```
backend/
├── api/
│   └── [[...route]].ts          ✅ Already created
├── src/
│   ├── app.ts                    ✅ Exports Express app
│   ├── server.ts
│   └── routes/
├── prisma/
│   ├── schema.prisma             ✅ Has DATABASE_URL env var
│   └── migrations/
├── vercel.json                   ✅ Already created
├── package.json                  ✅ Updated with @vercel/node
└── tsconfig.json
```

✅ = Already set up for you

---

## **STEP 4: Update Frontend Environment**

Create `.env.production` in your frontend directory:

```
VITE_API_URL=https://your-backend-domain.vercel.app/api
VITE_FIREBASE_CONFIG=... (your firebase config)
```

Or update your environment variable configuration in Vercel:
1. Go to Vercel Dashboard → Frontend Project
2. Settings → Environment Variables
3. Add `VITE_API_URL=https://your-backend-domain.vercel.app/api`

---

## **STEP 5: Run Database Migrations**

```bash
# 1. Migrate your local database schema to production
cd backend
npx prisma migrate deploy

# 2. Or if you haven't created migrations yet
npx prisma migrate dev --name init
```

**Important**: Make sure your `DATABASE_URL` points to the production database before running this!

---

## **STEP 6: Deploy!**

### Deploy Backend (from backend folder)
```bash
cd backend
vercel --prod
```

You'll be prompted:
- Project name: `supplements-backend` (or your choice)
- Use existing project: Yes
- Environment variables: Should auto-import from `.env.local`

### Deploy Frontend (from frontend folder)
```bash
cd frontend
vercel --prod
```

---

## **STEP 7: Update API Endpoints**

In your frontend code, replace hardcoded URLs:

```typescript
// ❌ Old (local)
const API_URL = 'http://localhost:5000/api';

// ✅ New (production)
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
```

---

## **STEP 8: Update CORS Settings**

In your `src/app.ts`, update CORS to allow production domain:

```typescript
const allowedOrigins = [
  'http://localhost:5173',           // Local dev
  'http://localhost:3000',           // Alternative local
  'https://your-frontend.vercel.app' // Production frontend
];

app.use(cors({
  origin: allowedOrigins,
  credentials: true
}));
```

---

## **STEP 9: Test Your Deployment**

1. **Test Backend**: Visit `https://your-backend.vercel.app`
   - Should see "Backend running"

2. **Test Frontend**: Visit your frontend URL
   - Check browser console for any API errors

3. **Test Database Connection**:
   ```bash
   curl https://your-backend.vercel.app/api/products
   ```

---

## **Troubleshooting**

### Database Connection Error
```
Error: connect ECONNREFUSED
```
**Solution**: 
- Check DATABASE_URL is correct
- Ensure database is running
- Check firewall allows connections from Vercel IPs

### API Not Found (404)
**Solution**:
- Check backend is deployed
- Verify API_URL in frontend env variables
- Check CORS settings

### Build Fails
```
error: prisma migrate deploy
```
**Solution**:
```bash
# Clear build cache
vercel --prod --force
```

### Static Files Not Serving
**Solution**: In Vercel, static files don't work with serverless functions. Move uploads to:
- **Firebase Storage** (recommended)
- **S3 / AWS**
- **Cloudinary**

---

## **Post-Deployment Checklist**

- [ ] Database migrations completed
- [ ] All env variables set in Vercel
- [ ] Backend deploys without errors
- [ ] Frontend deploys without errors
- [ ] API calls work from frontend
- [ ] Firebase/Razorpay working
- [ ] Email service working
- [ ] Images display correctly
- [ ] Payment flow tested
- [ ] Test order submission end-to-end

---

## **Useful Commands**

```bash
# View deployment logs
vercel logs [project-name] --prod

# Redeploy without code changes
vercel --prod

# View environment variables
vercel env ls

# Test locally with production env
vercel env pull .env.local
npm run dev
```

---

## **Need Help?**

- **Vercel Docs**: https://vercel.com/docs
- **Prisma & Vercel**: https://www.prisma.io/docs/guides/deployment/edge-functions
- **Common Issues**: https://vercel.com/docs/troubleshooting
