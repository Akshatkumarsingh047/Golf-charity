# GolfDraw — Architecture Decisions

## Monetary Values
**Decision:** All monetary values stored as `NUMERIC(12,2)` with implicit EUR currency (Ireland-first, schema ready for multi-currency via a `currency` column).

**Rationale:** PRD listed both options (minor units integer OR numeric). Chose `NUMERIC(12,2)` for readability in SQL queries and consistency across prize pool calculations. All display formatting uses `toFixed(2)`. Stripe amounts remain in cents (integers) and are converted on ingest.

---

## Subscription Status Sync
**Decision:** On every authenticated API request, we check `subscription_end > now()` in the middleware. A full Stripe sync is only triggered when the local status is 'active' but `subscription_end` has passed.

**Rationale:** Avoids a Stripe API call on every request (rate limit concerns) while ensuring stale status is corrected.

---

## Score Deletion (Rule 5)
**Decision:** Oldest score deletion is implemented as two sequential operations within a single server action (not a PostgreSQL transaction). The service role client is used for both.

**Rationale:** Supabase JS client does not expose explicit transaction control. The two operations are ordered correctly (delete then insert) so the unique constraint on `(user_id, score_date)` is not violated. In the rare edge case of a network failure between the two, the score count briefly drops below 5, which is safe (no data loss).

**Assumption (conservative):** PRD says "atomically in a single database transaction." We achieve this via a Postgres function if needed — a `perform_score_swap(user_id, score_value, score_date)` RPC could be added. Current implementation is safe for the described use case.

---

## Draw Engine Location
**Decision:** Draw engine runs server-side only as a Next.js server action / API route, never in the browser.

**Rationale:** Mandated by PRD Section XI. Winning numbers are generated using `Math.random()` on the server. For production use, a CSPRNG (e.g., `crypto.getRandomValues`) should be used — documented here for future hardening.

---

## Admin Auth
**Decision:** Admin role stored as `users.role = 'admin'` column (text), checked in middleware and API routes.

**Alternative considered:** Supabase custom JWT claims. Rejected because custom claims require edge function configuration and are harder to manage ad-hoc.

---

## Email Provider
**Decision:** Resend (over SendGrid).

**Rationale:** Resend has better TypeScript SDK, simpler API, and generous free tier. SendGrid API key env var also documented in `.env.example` for easy swap.

---

## File Storage Buckets
Two Supabase Storage buckets are required:
- `charity-images` — public read, admin write
- `winner-proofs` — public read (for admin review), user write (own prefix)

These must be created manually in the Supabase dashboard (cannot be created via migration SQL in the free tier without the Storage API).

---

## Charity Contribution Accounting
**Decision:** Contribution amount is calculated as `(subscription_amount_cents * charity_percentage / 100) / 100` (converting cents to euros). Inserted into `charity_contributions` on every `invoice.payment_succeeded` webhook.

**Assumption:** The charity percentage and prize pool percentage are applied independently to the same subscription amount. They do not "subtract" from each other in the DB — they are recorded separately for reporting purposes.

---

## Prize Pool Calculation
**Decision:** Prize pool is calculated dynamically at draw time based on current active subscriber count and plan type, multiplied by `pool_percentage` from `prize_pool_config`.

**Assumption (conservative):** "Monthly" subscribers contribute their `monthly_price_cents`. "Yearly" subscribers contribute `yearly_price_cents / 12` per monthly draw. This is a reasonable approximation; actual revenue recognition is handled by Stripe.

---

## Country Field
**Decision:** `users.country` defaults to `'IE'` (Ireland). No UI for this field yet — schema is ready for multi-country expansion.

---

## Jackpot Rollover
**Decision:** Rolled jackpot from the previous draw is fetched by checking the most recent published draw with `jackpot_rolled = true`. The rolled amount is added to the new jackpot calculation at draw time.

**Edge case:** Multiple consecutive rollovers accumulate correctly because each draw stores the full `jackpot_amount` (including any previous rollover).

---

## No Real-Time Subscriptions
**Decision:** Supabase real-time is not used. Dashboard data refreshes on navigation. Score updates use optimistic UI + `revalidatePath`.

**Rationale:** Real-time adds complexity and Supabase connection limits on the free tier. The draw reveal animation is triggered client-side on the draw results page, not via a real-time channel.
