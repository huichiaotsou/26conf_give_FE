# Repository Structure & Working Notes

## What This Repo Is
- React 19 + TypeScript single-page flow scaffolded by Vite 6, focused on the `/CONFGIVE` donation form.
- Styling combines MUI components with a global SCSS reset (`src/common/scss/reset.scss`) and page-specific styles (`src/pages/Congive.scss`).
- Form state, validation, and submission logic live in `src/pages/Confgive.tsx`, which wires TapPay (via the global `TPDirect`) together with Apple/Google Pay helpers and the credit-card fields.
- Routing is intentionally minimal: `/CONFGIVE` renders the donation experience, all other routes immediately redirect to `https://thehope.co/en/privacyterms`.

## Tech Stack & Tooling
- Build tool: Vite 6 (`pnpm dev`, `pnpm build`, `pnpm preview`).
- Language/runtime: React 19, TypeScript 5.7, JSX with the React 19 runtime.
- UI/tooling libraries: MUI, Emotion (`@emotion/styled`), `react-hook-form`, `react-router-dom@7`, `vite-plugin-environment` for injecting env vars, and Sass for styling.
- Linting: ESLint 9 (config in `eslint.config.js`).

## Directory Cheat Sheet
```
root/
├── package.json           # scripts + deps
├── pnpm-lock.yaml         # indicates pnpm is the package manager of record
├── src/
│   ├── main.tsx           # React entry point
│   ├── Router.tsx         # Router + redirect logic
│   ├── pages/             # All UI/logic for the donation flow
│   │   ├── Confgive.tsx   # main container with form + payment integrations
│   │   ├── Congive.scss   # scoped page styles
│   │   ├── *.tsx          # dialog, payment, receipt, upload components
│   ├── interface/         # TypeScript models (currently `confGiveProps.model.ts`)
│   └── common/scss/       # global styling primitives (reset)
├── public/                # static assets copied as-is
├── vite.config.ts         # Vite + EnvironmentPlugin setup
└── tsconfig*.json         # TS project configs (app + node tooling)
```

## Key Modules To Know
- `src/main.tsx`: boots the React app, imports the global reset styles, and renders `<AppRouter />`.
- `src/Router.tsx`: defines the only route (`/CONFGIVE`) and redirects everything else to the external privacy terms; handy place to add future routes.
- `src/pages/Confgive.tsx`:
  - Initializes TapPay (`TPDirect.setupSDK`) from env vars and configures Apple/Google Pay helpers on mount.
  - Uses `react-hook-form` with `ConfGiveProps` to manage fields such as amount, receipt info, attachments, and payment selection.
  - Chooses a default payment type based on user agent, keeps track of payment readiness states, and conditionally enables Pay buttons.
  - Delegates UI to child components: `CreditCard`, `ExchangeRate`, `PaymentSelect`, `Receipt`, `Upload`, `PayButton`, plus dialogs for alerts, notes, privacy policy, and success/failure states.
- Supporting components (`src/pages/*.tsx`): encapsulate individual dialogs, header, upload widget, etc., and should be reviewed when modifying UX for each step.
- `src/interface/confGiveProps.model.ts`: central type for the form; update it in sync with any new form fields.

## Environment & Secrets
Create a `.env` or `.env.local` at the repo root with the following keys (all strings):
```
VITE_TAPPAY_APP_ID=        # numeric ID from TapPay console
VITE_TAPPAY_APP_KEY=       # secret API key paired with the ID
VITE_APPLE_MERCHANT_ID=    # Apple Pay merchant identifier (e.g., merchant.com.example)
VITE_GOOGLE_MERCHANT_ID=   # Google Pay merchant ID
VITE_ENABLE_GOOGLE_PAY=    # 'true' (default) to show Google Pay, set to 'false' to hide it
VITE_APP_ENV=              # 'production' enables giving lock; 'staging' bypasses it
VITE_TAPPAY_ENV=           # 'production' (default) or 'sandbox' for TPDirect.setupSDK
VITE_PAYMENT_API_URL=      # backend payment endpoint (defaults to https://confgive.thehope.app/api/payment)
VITE_GIVING_START_AT=      # optional open time, e.g. 2026-04-20T12:00:00+08:00
VITE_GIVING_END_AT=        # optional close time, e.g. 2026-04-30T23:59:59+08:00
VITE_GIVING_LOCK_PASSWORD= # password used to dismiss the closed-giving overlay
```
These are consumed in `src/pages/Confgive.tsx` during TapPay setup. Missing values will log an error and payment widgets will not initialize. When `VITE_APP_ENV=production`, the form checks the giving window: before `VITE_GIVING_START_AT` it shows `奉獻將於 MM/DD 開放`, and after `VITE_GIVING_END_AT` it shows `目前未開放奉獻`. The closed-giving overlay can be dismissed with `VITE_GIVING_LOCK_PASSWORD`. When `VITE_APP_ENV=staging`, the lock is bypassed.

## Local Startup Cheat Sheet
1. **Prereqs**: Node 18.18+ (Vite 6 requirement) and pnpm 9 (run `corepack enable` once to use the bundled pnpm).
2. **Install dependencies**: `pnpm install` (uses `pnpm-lock.yaml`).
3. **Configure env**: add the `.env` file described above and keep secrets out of version control.
4. **Run the dev server**: `pnpm dev` → opens on http://localhost:5173 (or the next free port).
5. **Type-check / lint / build**:
   - `pnpm lint` for ESLint 9.
   - `pnpm build` for production assets (runs `tsc -b` first).
   - `pnpm preview` to sanity-check the production bundle locally.

Refer to `start.md` for a concise, copy/paste-ready startup walkthrough covering the same steps plus troubleshooting notes.
