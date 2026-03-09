# Manual Vercel Deployment Checklist

**Purpose:** Step-by-step instructions for deploying PriceOfElectricity.com via the Vercel dashboard.

---

## 1. Environment Variables to Enter

Enter these **before** clicking Deploy (or add them in the import flow when prompted).

| Variable | Value | Scope | Required |
|----------|-------|-------|----------|
| `NEXT_PUBLIC_SITE_URL` | `https://priceofelectricity.com` | Production, Preview | YES |
| `ALERT_EXPORT_TOKEN` | *(generate a strong random secret)* | Production | YES |
| `EMAIL_SINK` | `log` | Production, Preview | NO |

**ALERT_EXPORT_TOKEN:** Generate with `openssl rand -hex 32` or a password manager. Do not use `change-me`.

**Preview scope:** Use `https://priceofelectricity.com` for Preview as well for now. Preview deployments will show the same canonical until you add a custom domain.

---

## 2. Manual Dashboard Steps

### Step 1 — Open Vercel

1. Go to [https://vercel.com](https://vercel.com)
2. Sign in (GitHub recommended if your repo is on GitHub)

### Step 2 — Import the Repository

1. Click **Add New…** → **Project**
2. Under **Import Git Repository**, find **Fintek/priceofelectricity**
3. If it does not appear, click **Import Third-Party Git Repository** and paste: `https://github.com/Fintek/priceofelectricity`
4. Click **Import**

### Step 3 — Confirm Framework and Build Settings

1. **Framework Preset:** Next.js (should be auto-detected)
2. **Build Command:** Leave as-is. The repo’s `vercel.json` sets `npm run verify:vercel` — do not override
3. **Output Directory:** Leave default (empty or `.next`)
4. **Install Command:** Leave default (`npm install` or `yarn install`)

### Step 4 — Add Environment Variables

1. Expand **Environment Variables**
2. Add each variable:

   **Variable 1:**
   - Key: `NEXT_PUBLIC_SITE_URL`
   - Value: `https://priceofelectricity.com`
   - Environments: check **Production** and **Preview**

   **Variable 2:**
   - Key: `ALERT_EXPORT_TOKEN`
   - Value: *(paste your generated secret)*
   - Environments: check **Production** only

   **Variable 3 (optional):**
   - Key: `EMAIL_SINK`
   - Value: `log`
   - Environments: check **Production** and **Preview**

3. Click **Add** after each variable

### Step 5 — Deploy

1. Click **Deploy**
2. Wait for the build to finish (typically 3–8 minutes)

### Step 6 — Locate Deployment Logs

1. On the deployment page, the build log streams automatically
2. If you leave and return: Project → **Deployments** → click the deployment → **Building** or **Logs**
3. If the build fails, copy the **last 50–100 lines** of the log

### Step 7 — Locate the Production URL

1. After a successful deploy, the URL appears at the top (e.g. `https://priceofelectricity-xxx.vercel.app`)
2. Or: Project → **Settings** → **Domains** to see the production URL
3. Production deployments use the main branch (`main`)

---

## 3. Post-Deploy Verification Checklist

After deployment completes, verify:

- [ ] **Production URL opens** — The deployment URL loads in a browser
- [ ] **Homepage loads** — `/` returns 200, no fatal error
- [ ] **No fatal error** — No full-page error or “Application error”
- [ ] **Metadata/canonical** — View page source on `/`; `<link rel="canonical"` should point to `https://priceofelectricity.com`
- [ ] **Representative routes:**
  - [ ] `/texas` — 200
  - [ ] `/national` — 200
  - [ ] `/compare` — 200
  - [ ] `/knowledge` — 200
  - [ ] `/status` — 200

---

## 4. What to Report Back After Deployment

If deployment **succeeds**, report:

- Production URL (e.g. `https://priceofelectricity-xxx.vercel.app`)
- Whether all post-deploy checklist items passed

If deployment **fails**, report:

- Exact error message from the build log (last 50–100 lines)
- Step where it failed (e.g. “Building”, “Running build command”)
- Screenshot or copy of the red error line(s)
