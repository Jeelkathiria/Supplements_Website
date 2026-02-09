# CI/CD Troubleshooting Guide

Complete troubleshooting reference for GitHub Actions CI/CD issues.

---

## 🔴 Workflow Not Running

### Problem: No workflows appear in Actions tab

**Cause:** Workflows not detected or .github/workflows directory structure wrong

**Solution:**

```bash
# 1. Verify directory structure
ls -la .github/workflows/

# Should show:
# - backend.yml
# - frontend.yml
# - ci.yml
# - deploy.yml

# 2. Check file contents (must have valid YAML)
cat .github/workflows/backend.yml | head -5

# Should show:
# name: Backend CI
# on:
#   push:
#     paths:
```

**If not visible:**
1. Push files: `git add .github/ && git commit -m "Add workflows"`
2. Wait 30 seconds
3. Refresh GitHub Actions tab (hard refresh: Ctrl+Shift+R)
4. Click "Configure" → "Manual trigger" to activate

---

## 🔴 TypeScript Compilation Failed

### Error: `Type 'xyz' is not assignable to type 'abc'`

**Local test first:**
```bash
cd backend
npx tsc --noEmit

# For frontend
cd ../frontend
npx tsc --noEmit
```

**Common fixes:**

```typescript
// ❌ Problem: Type mismatch
const num: number = "123";

// ✅ Solution: Convert type
const num: number = parseInt("123");
```

**If different locally vs CI:**
1. Clear node_modules: `rm -rf node_modules`
2. Reinstall: `npm ci`
3. Run tsc again: `npx tsc --noEmit`
4. Check Node version: `node --version` (should be 18.x or 20.x)

---

## 🔴 Module Not Found

### Error: `Cannot find module 'xyz'`

**Check package.json:**
```bash
# Is it listed?
grep "module-name" package.json

# If not, install it
npm install module-name

# Commit the updated lock file
git add package-lock.json
git commit -m "Add dependency"
```

**If it's an internal module:**
```typescript
// ❌ Wrong path
import { sendEmail } from "emailService.ts";

// ✅ Correct path (relative)
import { sendEmail } from "../services/emailService";

// ✅ Correct path (absolute with @)
import { sendEmail } from "@/services/emailService";
```

---

## 🔴 Secrets Not Found

### Error: `BREVO_API_KEY is undefined` or `DATABASE_URL is not set`

**In workflows:**
```yaml
env:
  BREVO_API_KEY: ${{ secrets.BREVO_API_KEY }}

# This assumes GitHub secret named "BREVO_API_KEY" exists
```

**Fix:**

1. Go to: Repo → Settings → Secrets and variables → Actions
2. Click "New repository secret"
3. Add each secret exactly:
   - Name: `BREVO_API_KEY` (exact case, no spaces)
   - Value: `xkeysib-92cf02d94...` (exact value, no extra spaces)
4. Click Add secret
5. Repeat for all 7 secrets

**Verify:**
```bash
gh secret list --repo YOUR_REPO/Supplements
# Should show all 7 secrets (values hidden)
```

**If workflow still fails:**
1. Check secret name is spelled exactly in workflow file
2. Secret names are case-sensitive
3. Wait 1 minute for GitHub to sync
4. Manually trigger workflow: Actions → Workflow → "Run workflow"

---

## 🔴 Build Fails (Frontend)

### Error: `dist/ not found` or `Vite build failed`

**Local test:**
```bash
cd frontend
npm ci
npm run build

# Check if dist/ folder was created
ls -la dist/

# If not, see error message above
```

**Common causes:**

```javascript
// ❌ Missing import
import React from "react";  // But React is not imported at page top

// ✅ Import before using
import React from "react";
import { useState } from "react";

export function MyComponent() {
  const [count, setState] = useState(0);
  return <div>{count}</div>;
}
```

**Check src structure:**
```bash
ls -la frontend/src/

# Should have:
# - main.tsx
# - vite-env.d.ts
# - app/ (folder)
# - services/ (folder)
# - styles/ (folder)
```

**Vite config issues:**
```bash
# Check vite.config.ts
cat frontend/vite.config.ts | grep -A 5 "build:"

# Should have valid build configuration
```

---

## 🔴 Database Connection Issues

### Error: `Error connecting to database` or `ECONNREFUSED`

**In workflow logs:**
```
Unable to connect to localhost:5432
```

**Cause:** CI uses PostgreSQL service container (not local database)

**In workflow file (already configured):**
```yaml
services:
  postgres:
    image: postgres:latest
    env:
      POSTGRES_DB: supplements
      POSTGRES_USER: root
      POSTGRES_PASSWORD: root1234
    options: >-
      --health-cmd pg_isready
      --health-interval 10s
      --health-timeout 5s
      --health-retries 5
    ports:
      - 5432:5432
```

**Your job should connect to:**
```bash
DATABASE_URL=postgresql://root:root1234@localhost:5432/supplements
```

**If still failing:**
1. Check DATABASE_URL secret is set in GitHub
2. Verify connection string format: `postgresql://user:pass@host:port/db`
3. Ensure database migrations run before tests:
   ```bash
   npx prisma migrate deploy
   npx prisma generate
   ```

---

## 🔴 Hardcoded Secrets Detected

### Warning: `Commit contains hardcoded secrets`

**Do NOT:**
```bash
# ❌ Never commit secrets
echo "BREVO_API_KEY=xkeysib-123..." >> .env
git add .env
git commit -m "Add env"
```

**Do:**
```bash
# ✅ Use environment variables
# In .env (local only, not committed)
BREVO_API_KEY=xkeysib-123...

# In GitHub Actions (as secrets)
BREVO_API_KEY=${{ secrets.BREVO_API_KEY }}

# In production (environment variables)
export BREVO_API_KEY="xkeysib-123..."
```

**If accidentally committed:**
1. **IMMEDIATELY rotate the secret** (e.g., regenerate API key in Brevo)
2. Remove from code and git history:
   ```bash
   # Option 1: Remove file (simple)
   rm .env
   git add -A
   git commit -m "Remove .env file"
   git push
   
   # Option 2: Rewrite history (complex, only if necessary)
   git log --all --full-history -- ".env"
   git filter-branch --tree-filter 'rm -f .env' -- --all
   ```
3. Update GitHub secrets with new API key
4. Notify team immediately

---

## 🟡 Workflow Running Slow

### Workflow takes >10 minutes

**Check bottlenecks:**

```bash
# In workflow logs, look for timing
[1 min] Set up Node.js
[2 min] Restore npm cache
[3 min] npm ci (install dependencies)
[1 min] Run TypeScript
[1 min] Run ESLint
[....] Your custom steps
```

**Optimization tips:**

1. **Cache node_modules:**
```yaml
- uses: actions/setup-node@v3
  with:
    node-version: 18.x
    cache: 'npm'  # This caches node_modules
```

2. **Run tests in parallel:**
```yaml
strategy:
  matrix:
    node-version: [18.x, 20.x]
  # Tests run simultaneously, not sequentially
```

3. **Skip unnecessary jobs:**
```yaml
on:
  push:
    paths:
      - 'backend/**'
      - '.github/workflows/backend.yml'
  # Only run if backend files changed
```

---

## 🟡 License Header Warnings

### Warning: `File is missing license header`

**If using MIT License in your workflows:**

```bash
# Add header to each source file
/*
 * Copyright (c) 2025 SaturnImports
 * Licensed under the MIT License
 */

export function myFunction() {
  // ...
}
```

**Or disable checking:**
```yaml
# In ci.yml, comment out or remove:
# - name: Check license headers
#   run: npm run check:license
```

---

## 🟡 Security Vulnerability Detected

### Warning: `npm audit found vulnerabilities`

**Check which packages:**
```bash
npm audit

# Output shows:
# moderate severity in package-name@1.2.3
```

**Fix:**
```bash
# Option 1: Auto-fix
npm audit fix

# Option 2: Manual fix
npm install package-name@latest

# Verify fixed
npm audit
# Should show: "0 vulnerabilities"

# Commit
git add package-lock.json
git commit -m "Fix npm vulnerabilities"
```

**If can't fix immediately:**
1. Document the issue: why can't you update this package?
2. Create GitHub issue: "Update xyz to resolve vulnerability"
3. Plan fix for next sprint

---

## 🟢 Workflow Passed - Merge Blocked

### All checks green, but "Merge" button is disabled

**Cause:** Branch protection rules require approval

**Fix:**

1. Request review from team member
   - Click "Request a reviewer"
   - Select team member
   - Wait for their approval

2. Or temporarily disable protection (admin only):
   - Settings → Branches → Branch protection rules
   - Edit rule → Allow force pushes (temporarily)
   - Re-enable after merge

**Normal flow:**
```
Code pushed → CI runs → If green → Request review → Get approval → Merge ready
```

---

## 🟢 Deployment Failed

### Deployment workflow failed but CI passed

**Check deployment logs:**
1. Actions → Deploy workflow → Failed run
2. Expand "Deploy to [platform]" step
3. Look for error message

**Common deployment issues:**

```bash
# Docker build failed
docker build -t myapp .
# >>> Check Dockerfile syntax

# Vercel deployment failed
vercel --prod
# >>> Check vercel.json configuration

# Heroku deployment failed
heroku logs --tail
# >>> Check Procfile exists
```

---

## 🆘 Emergency: Broken Main Branch

### All PRs blocked because main is broken

**Quick fix:**

```bash
# 1. Create hotfix branch
git checkout -b hotfix/critical-fix main

# 2. Fix the issue
# ... make minimal changes only ...

# 3. Test locally
npm run build  # Must pass

# 4. Push immediately
git push origin hotfix/critical-fix

# 5. Create PR with title "[HOTFIX] ..."
# 6. Get emergency approval
# 7. Merge to main

# 8. Monitor for issues
```

**Prevent future incidents:**
- More careful testing before pushing
- Enable branch protection (require reviews)
- Add integration tests to catch issues early

---

## 📞 Getting Help

**If you're stuck:**

1. **Check this guide** (search for error message)
2. **Google the error:** Paste exact error + "github actions"
3. **Check workflow logs:** Click workflow → Expand failed step
4. **Ask team:** Share error screenshot + which branch + what changed
5. **Check GitHub docs:** https://docs.github.com/en/actions

**When asking for help, provide:**
- Exact error message (screenshot or copy-paste)
- Which workflow failed (backend, frontend, ci, deploy)
- Branch name
- What changes you made
- Local test results (did it work locally?)

---

## 📊 Health Check

Run this monthly to keep CI/CD healthy:

```bash
# 1. Check for stale secrets (rotate old ones)
gh secret list --repo YOUR_REPO/Supplements

# 2. Check for deprecated Node versions
# Update node-version in all .yml files to latest LTS

# 3. Check for dependency vulnerabilities
npm audit --audit-level=moderate

# 4. Check workflow execution time
# Look at recent workflow runs (should be <5 min)

# 5. Check for failed PRs still open
# Merge completed ones, close abandoned ones
```

---

**Last Updated:** 2025-02-09
**Questions?** Review [GitHub Actions Docs](https://docs.github.com/en/actions) or ask team lead
