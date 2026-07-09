# Threadocal Deployment Guide

This guide prepares Threadocal for a Vercel deployment and `threadocal.com` domain setup. Do not commit `.env.local`, do not paste real keys into documentation, and do not deploy until the checklist at the end is complete.

## Current Deployment Status

- Framework: Next.js 16
- Package manager: npm
- Build command: `npm run build`
- Demo data mode: localStorage/demo data
- Supabase Auth: paused in product work, but public Supabase environment variables are still required by existing auth code
- Production host target: Vercel
- Production domain target: `threadocal.com`

## Pre-Deployment Audit

Run these locally before pushing:

```bash
npm run lint
npx tsc --noEmit
npm run build
```

Confirm:

- `.env.local` exists locally but is not committed.
- `.gitignore` includes `.env*`.
- No private keys or service-role keys are committed.
- `package-lock.json` is committed so Vercel installs the same dependency tree.
- The app runs locally with `npm run dev`.

## Required Environment Variables

Add these in Vercel Project Settings, not in GitHub:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-public-anon-or-publishable-key
```

Notes:

- Use placeholders in docs only. Never paste real values here.
- `NEXT_PUBLIC_` variables are exposed to the browser by design, so only use public Supabase anon/publishable values.
- Do not add any Supabase service-role key to Vercel unless server-only code explicitly needs it later.
- Add variables to Production, Preview, and Development as needed.
- After changing Vercel environment variables, create a new deployment because prior deployments do not receive updated values automatically.

Reference: [Vercel environment variables](https://vercel.com/docs/environment-variables).

## Connect GitHub Repository to Vercel

1. Push the latest Threadocal code to GitHub.
2. Sign in to Vercel.
3. Click `Add New` / `New Project`.
4. Import the GitHub repository.
5. If prompted, choose:
   - Framework Preset: `Next.js`
   - Root Directory: project root containing `package.json`
   - Install Command: Vercel default, or `npm install`
   - Build Command: `npm run build`
   - Output Directory: leave default for Next.js
6. Add the required environment variables before the first production deployment.
7. Click `Deploy` only when ready.

Vercel creates preview deployments for branch pushes and production deployments from the production branch, usually `main`.

Reference: [Deploying Git repositories with Vercel](https://vercel.com/docs/git).

## Add `threadocal.com` in Vercel

1. Open the Vercel project.
2. Go to `Settings` -> `Domains`.
3. Add `threadocal.com`.
4. When prompted, also add `www.threadocal.com`.
5. Choose the preferred production domain:
   - Recommended: make `www.threadocal.com` primary and redirect `threadocal.com` to `www.threadocal.com`, or
   - Use `threadocal.com` as primary and redirect `www.threadocal.com` to it.
6. Copy the exact DNS records Vercel shows for the apex domain and `www` subdomain.

Vercel generally asks for:

- Apex/root domain (`threadocal.com`): an `A` record.
- Subdomain (`www.threadocal.com`): a `CNAME` record.

Always use the exact values shown in the Vercel dashboard because Vercel may provide project-specific DNS targets.

Reference: [Adding a domain in Vercel](https://vercel.com/docs/domains/working-with-domains/add-a-domain).

## GoDaddy DNS Setup

Use this if `threadocal.com` is registered at GoDaddy and you are keeping GoDaddy nameservers.

1. Sign in to GoDaddy.
2. Open `Domain Portfolio`.
3. Select `threadocal.com`.
4. Open `DNS`.
5. Remove or update conflicting existing records for:
   - `@`
   - `www`
6. Add the apex/root record exactly as Vercel shows:
   - Type: `A`
   - Name: `@`
   - Value: value shown by Vercel
   - TTL: default is fine
7. Add the `www` record exactly as Vercel shows:
   - Type: `CNAME`
   - Name: `www`
   - Value: value shown by Vercel
   - TTL: default is fine
8. Save records.
9. Return to Vercel and wait for domain verification.

GoDaddy notes that DNS changes often apply within an hour but may take up to 48 hours globally.

Reference: [GoDaddy add a CNAME record](https://www.godaddy.com/help/add-a-cname-record-19236).

## Post-Deployment Test Plan

After Vercel deployment and domain verification:

1. Open the Vercel deployment URL.
2. Open `https://threadocal.com`.
3. Open `https://www.threadocal.com`.
4. Confirm the non-primary domain redirects to the primary domain.
5. Confirm HTTPS is active and the browser shows a valid certificate.
6. Test demo routes:
   - `/`
   - `/shop`
   - `/shop/capital-heavyweight-hoodie`
   - `/brands`
   - `/brands/district-stitch-co`
   - `/cart`
   - `/checkout`
   - `/account`
   - `/brand-dashboard`
   - `/admin`
7. Test navigation:
   - Main nav links
   - Brands dropdown
   - Account dropdown
   - Footer customer and business links
8. Test demo localStorage flows:
   - Add product to cart
   - Change quantity
   - Checkout demo order
   - View order tracking
   - Hide and restore product in `/admin`
9. Confirm no production page shows local `.env.local` contents or secret keys.

## Deployment Checklist

- [ ] GitHub repository pushed.
- [ ] Vercel project created.
- [ ] Vercel project connected to GitHub repository.
- [ ] Environment variables added in Vercel.
- [ ] Production build passes locally.
- [ ] First Vercel deployment succeeds.
- [ ] `threadocal.com` added in Vercel.
- [ ] `www.threadocal.com` added in Vercel.
- [ ] GoDaddy DNS records configured from Vercel-provided values.
- [ ] Domain verification passes in Vercel.
- [ ] Primary domain selected.
- [ ] `www` redirect checked.
- [ ] HTTPS certificate checked.
- [ ] Demo routes tested.
- [ ] Cart, checkout, account, brand dashboard, and admin demo flows tested.

## Do Not Commit

Never commit:

- `.env.local`
- Real Supabase keys in docs
- Supabase service-role keys
- Vercel project secrets
- GoDaddy account credentials
