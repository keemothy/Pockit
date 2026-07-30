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

## Plaid bank connection

Pockit's sign-up/account authentication is separate from Plaid. Plaid Link is the secure, user-consented flow for connecting a bank or card; it never gives Pockit the user's bank password.

1. Create a Plaid developer account and copy the Sandbox `client_id` and `secret` from the [Plaid Dashboard](https://dashboard.plaid.com/).
2. Copy `.env.example` to `.env.local` and fill in those values. Do not commit `.env.local`.
3. Run `npm run dev` and open `/auth/login`, then choose **Connect account**. Use Plaid's Sandbox credentials when testing.

## Supabase setup (required)

Pockit uses Supabase for email/password accounts and for persisting connected Plaid accounts.

1. Create a project in the [Supabase Dashboard](https://supabase.com/dashboard), then open its **SQL Editor**.
2. Run the complete [database schema](supabase/schema.sql). It creates account tables and Row Level Security rules so users can only view their own account display data.
3. In the project **Connect** panel, copy the Project URL and Publishable key. In **Project Settings → API**, copy the server-only Service Role key.
4. Add all three values to `.env.local`, along with a 32-byte base64 `PLAID_TOKEN_ENCRYPTION_KEY` (the generation command is in `.env.example`). Keep the service role key and encryption key out of Git and browser code.
5. In Supabase **Authentication → URL Configuration**, add `http://localhost:3000/auth/login` to the Redirect URLs for local testing.

After configuration, users create an account at `/auth/login`, sign in, and connect their bank at `/auth/connect-bank`. The server encrypts each Plaid access token before saving it; only safe account details are sent to the browser.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
