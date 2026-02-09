# CI/CD Quick Reference

Fast reference for developers working with the CI/CD pipeline.

---

## 🚦 Workflow Status Meanings

| Status | Meaning | Action |
|--------|---------|--------|
| ✅ Green | All checks passing | Safe to merge |
| 🟡 Yellow | Running | Wait for completion |
| ❌ Red | Failed | Must fix before merge |
| ⏸️ Skipped | Condition not met | Expected, no action needed |

---

## 🔄 Common Workflows

### Making Changes to Backend

```bash
# Create a branch
git checkout -b feature/my-feature

# Make changes in backend/
# Test locally: npm run dev

# Commit
git add backend/
git commit -m "Add new feature"

# Push
git push origin feature/my-feature

# Create PR on GitHub
# Wait for CI checks to pass
# Get approval
# Merge
```

**CI will check:**
- ✅ TypeScript compiles
- ✅ Dependencies are valid
- ✅ No hardcoded secrets
- ✅ Runs on Node 18.x and 20.x

---

### Making Changes to Frontend

```bash
# Create a branch
git checkout -b feature/ui-update

# Make changes in frontend/
# Test locally: npm run dev

# Commit
git add frontend/
git commit -m "Update UI component"

# Push
git push origin feature/ui-update

# Create PR on GitHub
# Check Actions tab
# If all green → merge
```

**CI will check:**
- ✅ TypeScript compiles
- ✅ Vite build succeeds
- ✅ Dependencies are valid
- ✅ Build artifacts created

---

### Making Email Changes

```bash
# Edit emailService.ts
# Update templates
# Test locally with /api/test/email endpoint

# Push changes
git commit -m "Update order confirmation email"

# CI will verify:
- ✅ sendOrderConfirmationEmail exists
- ✅ sendOrderShippedEmail exists
- ✅ sendOrderDeliveredEmail exists
- ✅ All email functions properly defined
```

---

## ⚠️ Common CI Failures & Fixes

### "yarn not found" error
```bash
# Solution: Use npm not yarn
npm ci  # Use instead of: yarn install
```

### TypeScript compilation failed
```bash
# Fix type errors
npx tsc --noEmit

# Or check your IDE for errors before pushing
```

### "Cannot find module"
```bash
# Make sure all dependencies are in package.json
npm install package-name
# Then commit package-lock.json
```

### Build output not found
```bash
# Check that build script exists
npm run build

# Verify output directory in workflow matches
# For frontend: dist/
# For backend: build/ or src/
```

---

## 📊 Checking CI Status

### Option 1: GitHub Web
1. Go to your repo
2. Click **Actions** tab
3. Find your workflow
4. See status and logs

### Option 2: GitHub CLI
```bash
# Install: https://cli.github.com/
gh run list --repo YOUR_REPO/Supplements
gh run view RUN_ID
```

### Option 3: PR Page
1. Go to your Pull Request
2. Scroll to "Checks"
3. See all status checks
4. Click "Details" for logs

---

## 🔒 Working with Secrets

### Never commit these:
```javascript
// ❌ WRONG - Don't put in code
const API_KEY = "xkeysib-92cf02d94...";
const PASSWORD = "mongodb://user:pass@host";

// ✅ CORRECT - Use environment variables
const API_KEY = process.env.BREVO_API_KEY;
const DB_URL = process.env.DATABASE_URL;
```

### In CI/CD workflows:
```yaml
env:
  DATABASE_URL: ${{ secrets.DATABASE_URL }}
  BREVO_API_KEY: ${{ secrets.BREVO_API_KEY }}
```

### Accessing in code:
```typescript
// JavaScript/TypeScript
const apiKey = process.env.BREVO_API_KEY;

// Must be set in:
// 1. .env file (local development)
// 2. GitHub Secrets (CI/CD)
// 3. Server environment (production)
```

---

## ✅ Pre-commit Checklist

Before pushing, verify:

```bash
# 1. Backend changes
cd backend
npm ci
npx tsc --noEmit  # Check compilation

# 2. Frontend changes
cd ../frontend
npm ci
npm run build  # Check build succeeds

# 3. General
git diff        # Review changes
grep -r "console.log" backend/src  # Remove debug logs
grep -r "TODO\|FIXME" backend/src  # Check for incomplete work
```

---

## 📋 PR Checklist

Before creating a PR:

- [ ] All local tests pass
- [ ] TypeScript has no errors
- [ ] No `console.log` statements
- [ ] No hardcoded API keys/passwords
- [ ] Commit messages are clear
- [ ] Related to only one feature
- [ ] Updated documentation if needed
- [ ] Tested in multiple browsers (if frontend)
- [ ] .env changes documented

---

## 🐛 Debugging Failed Workflows

### Step 1: Find the failure
```
Actions → Click workflow → Click failed job
```

### Step 2: Read the error
```
Expand "Run npm install" or failed step
Look for red text with error message
```

### Step 3: Common fixes

**TypeScript Error:**
```bash
npx tsc --noEmit
# Fix the errors shown
```

**Missing dependency:**
```bash
npm install missing-package
npm ci  # Update lock file
```

**Path not found:**
```bash
# Check paths in workflow match your structure
ls -la backend/src/services/
```

**Environment variable missing:**
```bash
# Check GitHub Settings → Secrets
# Verify name matches exactly (case-sensitive)
# Verify value is correct (no extra spaces)
```

---

## 🎯 Best Practices

### 1. Small, focused commits
```bash
# ✅ GOOD
git commit -m "Add email service integration"

# ❌ BAD  
git commit -m "random stuff"
```

### 2. Keep features isolated
```bash
# ✅ GOOD
git checkout -b feature/email-service
# ... make email-related changes only

# ❌ BAD
# Mix frontend, backend, and database changes in one branch
```

### 3. Respond to CI quickly
- Red failing? Fix it same day
- Don't leave broken PRs open
- Each failure is a learning opportunity

### 4. Review logs
- See what took longest
- Understand what's being checked
- Learn from errors

---

## 🚀 After Merge to Main

When your PR is merged to `main`:

1. Workflows run automatically
2. All checks must pass (branch protection)
3. Code is ready for deployment
4. Deployment workflow available (manual trigger)

---

## ❓ FAQ

**Q: How long do workflows take?**
A: ~2-5 minutes total. Most time is Node.js setup and npm install.

**Q: Can I manually trigger a workflow?**
A: Yes! Actions tab → Click workflow → "Run workflow" button

**Q: What if CI is failing but my code is correct?**
A: Check:
1. Secrets are configured
2. Dependencies are installed locally
3. .env file exists for local development
4. Node version matches (18.x or 20.x)

**Q: Do I need to install GitHub CLI?**
A: No, optional. GitHub web interface is enough.

**Q: What if I accidentally commit a secret?**
A: 
1. Rotate/regenerate the secret immediately
2. Remove from code and .env
3. Create new commit
4. Update GitHub secret
5. Never push secrets again

---

## 📚 Links

- [CI Documentation](./.github/CI_CD_README.md)
- [GitHub Setup Guide](./.github/GITHUB_SETUP.md)
- [PR Template](./.github/pull_request_template.md)
- [GitHub Actions Docs](https://docs.github.com/en/actions)

---

**Happy coding! 🚀**

Got stuck? Check the detailed guides or ask your team lead!
