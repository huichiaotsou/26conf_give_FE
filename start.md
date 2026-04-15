# Getting Started (Local)

## Which package manager?
- Use **pnpm**. The repo includes `pnpm-lock.yaml`, and scripts assume pnpm (`pnpm dev`, `pnpm build`, etc.).
- If pnpm is not installed globally, run `corepack enable` (Node 18+ bundles pnpm) or install pnpm 9 manually.

## Prerequisites
- Node.js 18.18 or newer (matches Vite 6 support matrix).
- Access to TapPay / Apple Pay / Google Pay credentials for the `.env` file.

## Environment variables
Create `.env` (or `.env.local`) at the project root before running the app:
```
VITE_TAPPAY_APP_ID=            # numeric TapPay App ID
VITE_TAPPAY_APP_KEY=           # TapPay App Key (keep secret)
VITE_APPLE_MERCHANT_ID=        # Apple Pay merchant identifier
VITE_GOOGLE_MERCHANT_ID=       # Google Pay merchant ID
VITE_ENABLE_GOOGLE_PAY=        # 'true' (default) to show Google Pay; set 'false' to hide it
VITE_APP_ENV=                  # 'production' enables giving lock; 'staging' bypasses it
VITE_TAPPAY_ENV=               # 'production' (default) or 'sandbox' to pick TapPay mode
VITE_PAYMENT_API_URL=          # backend payment API (defaults to https://confgive.thehope.app/api/payment)
VITE_GIVING_START_AT=          # optional open time, e.g. 2026-04-20T12:00:00+08:00
VITE_GIVING_END_AT=            # optional close time, e.g. 2026-04-30T23:59:59+08:00
VITE_GIVING_LOCK_PASSWORD=     # password used to dismiss the closed-giving overlay
```
These are read in `src/pages/Confgive.tsx` during `TPDirect.setupSDK`; missing values will keep Pay integrations from initializing. When `VITE_APP_ENV=production`, the UI checks the giving window: before `VITE_GIVING_START_AT` it shows `奉獻將於 MM/DD 開放`, and after `VITE_GIVING_END_AT` it shows `目前未開放奉獻`. The closed-giving overlay can be dismissed with `VITE_GIVING_LOCK_PASSWORD`. When `VITE_APP_ENV=staging`, this lock is bypassed.

## Install & run
```bash
pnpm install        # installs deps from pnpm-lock
pnpm dev            # starts Vite on http://localhost:5173
```

## Optional workflows
- `pnpm lint` – ESLint 9 over the entire repo.
- `pnpm build` – type-check + production build into `dist/`.
- `pnpm preview` – serve the built assets locally to verify production output.

If the dev server fails to start, confirm the env vars are present and that no other process occupies port 5173; use `pnpm dev --host` if you need LAN access.
