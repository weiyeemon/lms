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

## LMS local setup

1. Copy `.env.example` to `.env.local` and set the Supabase public URL and anon/publishable key.
2. Start Supabase and apply the migrations.
3. Start the application with `npm run dev`.

An authenticated Supabase user must be linked to an active `employees` record through `auth_user_id`.

## Verification

```bash
npm test
npm run lint
npx tsc --noEmit
npm run build
```

The browser E2E test creates a dedicated employee in a test Supabase project. Never point its service-role key at production.

```bash
npm run test:e2e:install
npm run test:e2e
```

Set `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `E2E_EMAIL`, and `E2E_PASSWORD` before running it.

## LMS deployment checklist

1. Link the repository to a Vercel project.
2. Add `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` to the Vercel environment.
3. Apply `supabase/migrations` to the hosted Supabase project.
4. Deploy, sign in with a linked employee account, submit one request, and confirm it remains in Request history after refresh.

Do not configure `SUPABASE_SERVICE_ROLE_KEY` in the application deployment; it is used only by the E2E test setup.
