# GitHub CI/CD Setup Guide

Complete step-by-step guide to enable and configure your CI/CD pipeline on GitHub.

---

## 📋 Prerequisites

✅ Repository pushed to GitHub  
✅ `.github/workflows/*.yml` files in your repo  
✅ GitHub account with repo access

---

## 🚀 Step 1: Enable GitHub Actions

### 1.1 Go to Actions Tab

1. Open your GitHub repository
2. Click the **Actions** tab
3. You should see your workflows listed:
   - Backend CI
   - Frontend CI
   - Full Stack CI
   - Deployment

### 1.2 Enable Workflows (if needed)

- If disabled, click **"I understand my workflows, go ahead and enable them"**
- Workflows are enabled by default for new repos

---

## 🔒 Step 2: Add Secrets

Secrets are encrypted environment variables used by workflows.

### 2.1 Navigate to Secrets

1. Go to repo **Settings**
2. In left sidebar: **Secrets and variables** → **Actions**
3. Click **New repository secret** (green button)

### 2.2 Add Each Secret

Add these secrets one by one:

#### Secret 1: DATABASE_URL
```
Name: DATABASE_URL
Value: postgresql://user:password@host:5434/supplementdb
```

#### Secret 2: BREVO_API_KEY
```
Name: BREVO_API_KEY
Value: xkeysib-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```
(Paste your actual Brevo API key here)

#### Secret 3: SENDER_EMAIL
```
Name: SENDER_EMAIL
Value: your-email@example.com
```
(Your sender email from Brevo)

#### Secret 4: RAZORPAY_KEY_ID
```
Name: RAZORPAY_KEY_ID
Value: rzp_test_xxxxxxxxxx
```
(Your Razorpay test key ID)

#### Secret 5: RAZORPAY_KEY_SECRET
```
Name: RAZORPAY_KEY_SECRET
Value: xxxxxxxxxxxxxxxxxxxxxxxx
```
(Your Razorpay test secret key)

#### Secret 6: SENDER_NAME (optional)
```
Name: SENDER_NAME
Value: SaturnImports
```

#### Secret 7: FRONTEND_URL (optional)
```
Name: FRONTEND_URL
Value: http://localhost:5173
```

---

## 🛡️ Step 3: Branch Protection Rules

Enforce CI/CD checks before merging.

### 3.1 Create Protection Rule

1. Go to repo **Settings**
2. Left sidebar: **Branches** → **Branch protection rules**
3. Click **Add rule**

### 3.2 Configure Protection

**Branch name pattern:**
```
main
```

**Check these boxes:**

- ✅ **Require a pull request before merging**
  - Require approvals: **1**
  - Require review from code owners: (optional)

- ✅ **Require status checks to pass before merging**
  - Require branches to be up to date: **✓**
  - Status checks that must pass:
    - `Backend CI (18.x)`
    - `Backend CI (20.x)`
    - `Frontend CI (18.x)`
    - `Frontend CI (20.x)`
    - `Code Quality Checks`
    - `Backend Tests`
    - `Frontend Tests`
    - `Security Scan`

- ✅ **Restrict who can push to matching branches** (optional, for teams)

- ✅ **Allow force pushes** (optional for admins only)

3. Click **Create** button

---

## 📊 Step 4: View Workflow Runs

### 4.1 Actions Tab

Navigate to **Actions** to see:
- ✅ All workflow runs
- ⏳ In-progress runs
- ❌ Failed runs
- ✅ Successful runs

### 4.2 View Details

1. Click any workflow run
2. See:
   - Overall status
   - Individual job results
   - Logs for each step
   - Timing information

### 4.3 Troubleshoot Failures

If a workflow fails:

1. Click the failed job
2. Expand the failed step
3. Read the error message
4. Common solutions:
   - Missing secrets
   - Dependency issues
   - TypeScript errors
   - Environment variable mismatch

---

## 📝 Step 5: First Workflow Test

### 5.1 Trigger a Workflow

Make a small change and push:

```bash
echo "# Updated" >> README.md
git add README.md
git commit -m "Test CI/CD pipeline"
git push origin main
```

### 5.2 Watch It Run

1. Go to **Actions** tab
2. See the workflow trigger
3. Watch each job complete
4. All should show ✅ (green checkmark)

---

## 🎯 Step 6: Set Up PR Checks

When team members create pull requests, CI automatically runs.

### 6.1 Create Test PR

```bash
git checkout -b feature/test
echo "test" > test.txt
git add test.txt
git commit -m "Test PR"
git push origin feature/test
```

### 6.2 Create Pull Request

1. Go to GitHub repo
2. Click **Compare & pull request**
3. GitHub runs workflows automatically
4. See status checks on PR:
   - 🟡 In progress...
   - ✅ All checks passed (can merge)
   - ❌ Checks failed (can't merge)

---

## 🔄 Step 7: Continuous Integration Flow

This is your automated workflow:

```
Push Code
    ↓
Workflows Trigger
    ├─ Backend CI runs
    ├─ Frontend CI runs
    └─ Full Stack CI runs (code quality, tests, security)
    ↓
Results available in Actions tab
    ├─ ✅ All pass → Can merge PR
    └─ ❌ Any fail → Fix and push again
    ↓
Merge to main (if using branch protection)
    ↓
Deployment workflow ready (manual or auto)
```

---

## 📋 Monitoring Checklist

Daily/Weekly:
- [ ] Check Actions tab for failures
- [ ] Review security warnings
- [ ] Check dependency updates
- [ ] Monitor build times

Monthly:
- [ ] Review and update dependencies
- [ ] Analyze workflow performance
- [ ] Plan infrastructure upgrades
- [ ] Review security scan results

---

## 🆘 Troubleshooting

### Problem: Workflow won't run
**Solution:**
1. Ensure `.github/workflows/*.yml` files are in repo
2. Commit and push the workflows
3. Wait ~30 seconds for GitHub to index them
4. Make a new commit to trigger workflow

### Problem: "Cannot find module"
**Solution:**
1. Workflow runs `npm ci` which installs exact versions
2. Ensure `package-lock.json` is committed
3. No local `node_modules` needed in repo

### Problem: Secrets not available
**Solution:**
1. Check secret name matches exactly (case-sensitive)
2. Use format: `${{ secrets.SECRET_NAME }}`
3. Secrets only available to pushed code, not PRs from forks

### Problem: "Permission denied" on database
**Solution:**
1. Database connection is local-only in CI
2. Database tests not enabled yet (optional setup)
3. TypeScript compile checks still run

### Problem: Build takes too long
**Solution:**
1. Most builds finish in 2-5 minutes
2. Node.js setup: ~20 seconds
3. npm install: ~30 seconds
4. Build: ~1-2 minutes
5. If longer, check for large dependencies

---

## 📚 Advanced: Email Preview

For email template changes, the workflow includes email service verification. When you:

1. Create/update email templates in `emailService.ts`
2. Push to a PR
3. Workflow checks:
   - ✅ Function signatures exist
   - ✅ Email parameters correct
   - ✅ HTML syntax valid (no checks yet, manual review needed)

---

## 🎓 Best Practices

### 1. Keep Workflows Fast
- Minimize dependencies
- Use cached Node modules
- Parallel jobs when possible

### 2. Clear Commit Messages
```
✅ Good:
"Add email service for order confirmation"
"Fix TypeScript compilation error"

❌ Bad:
"fix"
"asdfasdf"
```

### 3. One Feature Per PR
- Easier to review
- Faster CI/CD
- Better history

### 4. Respond to CI Failures
- Fix immediately
- Don't merge red builds
- Learn from failures

### 5. Document Changes
- Update README if logic changes
- Add comments for complex code
- Keep CI_CD_README.md updated

---

## 🚀 Next Steps

1. ✅ **Push to GitHub** (if not done)
2. ✅ **Add secrets** (Step 2)
3. ✅ **Set branch protection** (Step 3)
4. ✅ **Create test PR** (Step 6)
5. 📚 **Review logs** in Actions tab
6. 🎯 **Integrate with team** workflow

---

## 📞 Support

### GitHub Actions Docs
- [Actions Documentation](https://docs.github.com/en/actions)
- [Workflow Syntax](https://docs.github.com/en/actions/using-workflows/workflow-syntax-for-github-actions)

### Debugging
1. Actions tab → failed workflow
2. Click job name
3. Expand each step
4. Read console output

### Common Resources
- Node.js setup: `actions/setup-node@v3`
- Dependency caching: `cache: 'npm'`
- Secrets: `${{ secrets.VARIABLE_NAME }}`

---

**Your CI/CD pipeline is now ready! 🎉**

All workflows will run automatically on:
- ✅ Push to `main`
- ✅ Push to `develop`
- ✅ Pull requests (any branch)

Happy coding! 🚀
