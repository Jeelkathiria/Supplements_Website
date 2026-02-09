# CI/CD Pipeline Documentation

This project uses **GitHub Actions** for continuous integration and deployment. All workflows are configured to run automatically on push and pull requests.

---

## 📋 Workflows Overview

### 1. **Backend CI** (`.github/workflows/backend.yml`)
Runs on changes to `backend/` directory

**Checks:**
- ✅ TypeScript compilation
- ✅ Dependency installation
- ✅ ESLint linting
- ✅ Environment variables validation
- ✅ Runs on Node.js 18.x and 20.x

**Triggers:**
- Push to `main` or `develop`
- Pull request to `main` or `develop`

---

### 2. **Frontend CI** (`.github/workflows/frontend.yml`)
Runs on changes to `frontend/` directory

**Checks:**
- ✅ TypeScript compilation
- ✅ Dependency installation  
- ✅ ESLint linting
- ✅ Build generation (Vite)
- ✅ Build artifact verification
- ✅ Runs on Node.js 18.x and 20.x

**Triggers:**
- Push to `main` or `develop`
- Pull request to `main` or `develop`

---

### 3. **Full Stack CI** (`.github/workflows/ci.yml`)
Comprehensive checks for the entire application

**Jobs:**

#### Code Quality
- Prisma schema formatting
- Console.log detection
- Hardcoded secrets check

#### Backend Tests (with PostgreSQL)
- TypeScript compilation
- Prisma schema validation
- Email service verification
- Dependency audit

#### Frontend Tests
- TypeScript compilation
- Vite build
- Build artifact verification
- Dependency audit

#### Security Scan
- NPM audit for both backend and frontend
- Hardcoded secrets detection
- Environment variables check

**Triggers:**
- Every push to `main` or `develop`
- Every pull request

---

### 4. **Deployment** (`.github/workflows/deploy.yml`)
Ready-to-use templates for deployment

Currently shows:
- ✅ Deployment checklist
- 📝 Secrets management guide
- 🐳 Example Docker setup (commented)
- 🚀 Example Vercel setup (commented)

**Triggers:**
- Push to `main` branch only
- Git tags (v*)

---

## 🚀 Getting Started

### Step 1: Push Code to GitHub

1. Initialize git (if not already done):
```bash
cd Supplements
git init
git add .
git commit -m "Initial commit with CI/CD pipeline"
```

2. Add GitHub remote:
```bash
git remote add origin https://github.com/YOUR_USERNAME/Supplements.git
git branch -M main
git push -u origin main
```

### Step 2: View Workflow Runs

1. Go to your GitHub repo
2. Click **Actions** tab
3. See all workflow runs listed
4. Click any workflow to see detailed logs

---

## 🔐 Secrets Configuration

For deployment and sensitive operations, add secrets to GitHub:

### How to Add Secrets:

1. GitHub repo → **Settings**
2. **Secrets and variables** → **Actions**
3. Click **New repository secret**
4. Add each secret:

| Secret Name | Value | Where to get |
|-------------|-------|--------------|
| `DATABASE_URL` | PostgreSQL connection string | Your DB provider |
| `BREVO_API_KEY` | Email API key | Brevo dashboard |
| `SENDER_EMAIL` | Sender email (verified in Brevo) | Your email |
| `RAZORPAY_KEY_ID` | Razorpay public key | Razorpay dashboard |
| `RAZORPAY_KEY_SECRET` | Razorpay secret key | Razorpay dashboard |

### How to Use in Workflows:

```yaml
env:
  DATABASE_URL: ${{ secrets.DATABASE_URL }}
  BREVO_API_KEY: ${{ secrets.BREVO_API_KEY }}
```

---

## 📊 Workflow Status Badges

Add these to your README.md to show CI status:

```markdown
![Backend CI](https://github.com/YOUR_USERNAME/Supplements/actions/workflows/backend.yml/badge.svg)
![Frontend CI](https://github.com/YOUR_USERNAME/Supplements/actions/workflows/frontend.yml/badge.svg)
![Full Stack CI](https://github.com/YOUR_USERNAME/Supplements/actions/workflows/ci.yml/badge.svg)
```

---

## 🧪 What Each Workflow Checks

### Backend Checks:
```
✓ Syntax validation (TypeScript)
✓ Type safety
✓ Dependency management
✓ Environment setup
✓ Database schema (Prisma)
✓ Email service configuration
```

### Frontend Checks:
```
✓ Syntax validation (TypeScript)
✓ Type safety
✓ Dependency management
✓ Build process (Vite)
✓ Build output
✓ Asset generation
```

### Security Checks:
```
✓ NPM vulnerabilities (moderate level)
✓ Hardcoded secrets detection
✓ .env validation
✓ Dependencies audit
```

---

## 🚨 Common Issues & Solutions

### ❌ "Database connection failed"
**Solution:** Backend CI uses PostgreSQL service container. Only affects integration tests (not enabled yet).

### ❌ "VITE_API_URL not found"
**Solution:** Already configured in frontend workflow. Update if your API URL changes.

### ❌ "ESLint not found"
**Solution:** It's optional. Install with: `npm install --save-dev eslint`

### ❌ "Build failed - memory"
**Solution:** GitHub Actions has 7GB RAM. Usually sufficient. Split large builds if needed.

---

## 📈 Enabling Additional Features

### 1. **Code Coverage Reports**
Add coverage reporting to your workflows:
```yaml
- name: Upload coverage
  uses: codecov/codecov-action@v3
  with:
    files: ./coverage/coverage-final.json
```

### 2. **Automated Releases**
Enable release creation on version tags:
```yaml
- name: Create Release
  uses: actions/create-release@v1
  if: startsWith(github.ref, 'refs/tags/')
```

### 3. **Notifications**
Get notified of failures via:
- Email (GitHub default)
- Slack integration
- Discord webhook

### 4. **Automatic Deployments**
Uncomment deployment jobs in `deploy.yml` and configure:
- Vercel (Frontend)
- AWS, DigitalOcean, Heroku (Backend)
- Docker registries

---

## 📚 Advanced: Customize Workflows

### Change Node.js version:
```yaml
- uses: actions/setup-node@v3
  with:
    node-version: '20.x'  # Change this
```

### Add environment variables:
```yaml
env:
  NODE_ENV: production
  API_URL: https://api.example.com
```

### Run on specific branches:
```yaml
on:
  push:
    branches: [ main, staging, develop ]  # Add/remove branches
```

### Conditional steps:
```yaml
if: github.event_name == 'pull_request'
  # Only run on PRs
```

---

## 🔗 Resources

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Workflow Syntax](https://docs.github.com/en/actions/using-workflows/workflow-syntax-for-github-actions)
- [Node.js Setup Action](https://github.com/actions/setup-node)
- [Pre-made Actions](https://github.com/marketplace?type=actions)

---

## ✅ Next Steps

1. **Push code to GitHub** (if not done)
2. **View Actions tab** to see workflows running
3. **Add secrets** for deployment (DATABASE_URL, BREVO_API_KEY, etc.)
4. **Customize workflows** for your deployment platform
5. **Enable branch protection** to require CI checks pass before merging

---

## 📞 Support

For GitHub Actions issues:
1. Check the **Actions** tab → failed workflow
2. Click the failed job
3. Expand the failed step
4. Read error messages for solutions
5. Common fixes in "Common Issues" section above
