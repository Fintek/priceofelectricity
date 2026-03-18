This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## Deployment Readiness

**PriceOfElectricity.com** — Electricity price data and insights.

### Before Deploy

1. Run validation: `npm run knowledge:build && npm run knowledge:verify && npm run build && npm run lint && npm run verify`
2. Configure env vars in Vercel: `NEXT_PUBLIC_SITE_URL`, `EMAIL_SINK`, `ALERT_EXPORT_TOKEN` (see `.env.example`)
3. GitHub commit and Vercel deploy happen after validation passes

See `docs/DEPLOYMENT_READINESS.md` for full details.

### Vercel Build

Vercel runs `npm run verify:vercel` (full validation without LHCI). LHCI requires Chrome; run it in GitHub Actions.

### Knowledge Artifact Policy

- Canonical machine-consumed knowledge artifact paths are non-`.gz` `/knowledge/*.json` endpoints.
- Legacy `.json.gz` sidecar artifacts are not part of the active artifact contract.
- For policy details and implementation-adjacent references, see `docs/DEPLOYMENT_VERCEL.md`, plus comments in `scripts/knowledge-build.ts` and `scripts/verify-knowledge.js`.
