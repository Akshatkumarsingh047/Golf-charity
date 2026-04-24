# GolfDraw — Setup Guide

## Prerequisites
- Node.js 18+
- A new Supabase project (supabase.com)
- A Stripe account (stripe.com)
- A Resend account (resend.com)
- A Vercel account (vercel.com)

---

## 1. Clone & Install

```bash
git clone <your-repo>
cd golf-charity-platform
npm install
```

---

## 2. Supabase Setup

1. Create a **new** Supabase project at https://supabase.com
2. Go to **SQL Editor** and run the full migration:
   ```
   supabase/migrations/001_initial.sql
   ```
3. Go to **Storage** → Create two public buckets:
   - `charity-images` (public, 5MB file size limit)
   - `winner-proofs` (public, 5MB file size limit)
4. Copy your project URL and API keys from **Settings → API**

---

## 3. Stripe Setup

1. Create a Stripe account and enable **Test Mode**
2. Create two products in the Stripe Dashboard:
   - **GolfDraw Monthly** → Recurring, €9.99/month → copy Price ID
   - **GolfDraw Yearly** → Recurring, €99.99/year → copy Price ID
3. Enable the **Customer Portal** at https://dashboard.stripe.com/settings/billing/portal
4. Add a webhook endpoint pointing to `https://your-vercel-url.vercel.app/api/stripe/webhook`
   - Events to listen for:
     - `checkout.session.completed`
     - `invoice.payment_succeeded`
     - `invoice.payment_failed`
     - `customer.subscription.deleted`
5. Copy the webhook signing secret

---

## 4. Resend Setup

1. Create a Resend account at https://resend.com
2. Add and verify your sending domain
3. Create an API key
4. Update `FROM` in `src/lib/email/index.ts` to your verified domain

---

## 5. Environment Variables

Copy `.env.local.example` to `.env.local` and fill in all values:

```bash
cp .env.local.example .env.local
```

Required variables:
```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
STRIPE_SECRET_KEY=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
STRIPE_WEBHOOK_SECRET=
STRIPE_MONTHLY_PRICE_ID=
STRIPE_YEARLY_PRICE_ID=
RESEND_API_KEY=
NEXT_PUBLIC_APP_URL=http://localhost:3000
ADMIN_EMAIL=admin@yourdomain.com
```

Also add for pricing page:
```
NEXT_PUBLIC_STRIPE_MONTHLY_PRICE_ID=
NEXT_PUBLIC_STRIPE_YEARLY_PRICE_ID=
```

---

## 6. Create Admin User

1. Run the app locally: `npm run dev`
2. Sign up at `/auth/signup` with your `ADMIN_EMAIL`
3. Verify your email
4. Run this SQL in Supabase SQL Editor:
   ```sql
   UPDATE users SET role = 'admin' WHERE email = 'admin@yourdomain.com';
   ```
5. Visit `/admin` — you should now have access

---

## 7. Local Development

```bash
npm run dev
```

For Stripe webhooks locally, use the Stripe CLI:
```bash
stripe listen --forward-to localhost:3000/api/stripe/webhook
```
This will give you a local webhook secret — update `STRIPE_WEBHOOK_SECRET` accordingly.

---

## 8. Deploy to Vercel

1. Push code to GitHub
2. Import the repo in Vercel
3. Add all environment variables in Vercel dashboard (Settings → Environment Variables)
4. Update `NEXT_PUBLIC_APP_URL` to your Vercel deployment URL
5. Update the Stripe webhook endpoint to your Vercel URL
6. Deploy!

---

## 9. Post-Deployment Checklist

- [ ] Migration SQL ran successfully
- [ ] Storage buckets created
- [ ] Stripe products and prices created
- [ ] Stripe webhook configured and verified
- [ ] Admin user created and role set
- [ ] Test signup flow end-to-end
- [ ] Test Stripe checkout (use test card `4242 4242 4242 4242`)
- [ ] Test score entry (add 6 scores to verify oldest is replaced)
- [ ] Test charity selection and percentage slider
- [ ] Test admin draw simulation
- [ ] Test admin draw publish
- [ ] Verify email notifications are sent

---

## Draw Schedule

Draws are **manual** — there is no cron job. The admin must:
1. Go to `/admin/draws`
2. Select draw type (random or algorithmic)
3. Click **Simulate Draw** to preview
4. Click **Publish Draw** to commit and notify all participants

This is by design per the PRD.
