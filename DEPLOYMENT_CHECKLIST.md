# Quick Deployment Checklist

## Pre-Deployment (Do These NOW)

- [ ] **Database Created**
  - [ ] PostgreSQL database provisioned (Vercel Postgres / Supabase / Railway)
  - [ ] Connection string (DATABASE_URL) ready
  
- [ ] **Code Updates**
  - [ ] vercel.json created ✅
  - [ ] api/[[...route]].ts created ✅
  - [ ] package.json updated with @vercel/node ✅
  - [ ] CORS updated for production domains
  - [ ] Frontend API_URL uses env variables ✅

- [ ] **Environment Variables Prepared**
  - [ ] DATABASE_URL
  - [ ] FIREBASE_PROJECT_ID
  - [ ] FIREBASE_PRIVATE_KEY
  - [ ] FIREBASE_CLIENT_EMAIL
  - [ ] FIREBASE_STORAGE_BUCKET
  - [ ] RAZORPAY_KEY_ID
  - [ ] RAZORPAY_KEY_SECRET
  - [ ] BREVO_API_KEY

- [ ] **Vercel Account Setup**
  - [ ] Signed up on https://vercel.com
  - [ ] Vercel CLI installed: `npm install -g vercel`
  - [ ] Logged in: `vercel login`

## Deployment Steps

### Backend Deployment
```bash
cd backend
npm install                    # Install new dependencies
vercel --prod                 # Deploy to production
```

### Database Migration
```bash
# Make sure DATABASE_URL points to production!
cd backend
npx prisma migrate deploy     # Run migrations
```

### Frontend Deployment
```bash
cd frontend
vercel --prod                 # Deploy to production
```

## Post-Deployment

- [ ] Backend URL working (https://your-backend.vercel.app)
- [ ] Frontend URL working (https://your-frontend.vercel.app)
- [ ] API calls successful from frontend
- [ ] Images loading correctly
- [ ] Payment flow working
- [ ] Email notifications working
- [ ] Test full order flow end-to-end

## Commands During Deployment

```bash
# View logs if deployment fails
vercel logs [project-name] --prod

# Redeploy
vercel --prod

# Check environment variables
vercel env ls
```

## Important Notes

⚠️ **DO NOT** commit `.env` files - only use Vercel's environment variable dashboard

🔒 **Firebase Private Key** - Keep sensitive, store only in Vercel env vars

📦 **Database Backups** - Set up automated backups in your database provider

🔄 **CI/CD** - Vercel auto-deploys when you push to main branch (if connected to GitHub)
