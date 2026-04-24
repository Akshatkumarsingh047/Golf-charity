-- ─────────────────────────────────────────────────────────────────────────────
-- GolfDraw — Complete Database Migration
-- Run this in the Supabase SQL Editor on a fresh project
-- ─────────────────────────────────────────────────────────────────────────────

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ─── CHARITIES ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS charities (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name            TEXT NOT NULL,
  description     TEXT,
  image_url       TEXT,
  website_url     TEXT,
  is_featured     BOOLEAN NOT NULL DEFAULT false,
  upcoming_events JSONB DEFAULT '[]'::jsonb,
  is_active       BOOLEAN NOT NULL DEFAULT true,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─── USERS (extends auth.users) ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id                  UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email               TEXT UNIQUE NOT NULL,
  full_name           TEXT,
  stripe_customer_id  TEXT UNIQUE,
  subscription_status TEXT NOT NULL DEFAULT 'inactive'
    CHECK (subscription_status IN ('active', 'inactive', 'cancelled', 'lapsed')),
  subscription_plan   TEXT CHECK (subscription_plan IN ('monthly', 'yearly')),
  subscription_end    TIMESTAMPTZ,
  charity_id          UUID REFERENCES charities(id) ON DELETE SET NULL,
  charity_percentage  INTEGER NOT NULL DEFAULT 10 CHECK (charity_percentage >= 10 AND charity_percentage <= 100),
  role                TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  country             TEXT NOT NULL DEFAULT 'IE',
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─── SCORES ──────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS scores (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  score_value INTEGER NOT NULL CHECK (score_value >= 1 AND score_value <= 45),
  score_date  DATE NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, score_date)
);

-- ─── DRAWS ───────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS draws (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  draw_month      DATE NOT NULL UNIQUE,
  draw_type       TEXT NOT NULL CHECK (draw_type IN ('random', 'algorithmic')),
  status          TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'simulated', 'published')),
  winning_numbers INTEGER[] NOT NULL,
  jackpot_amount  NUMERIC(12,2) NOT NULL DEFAULT 0,
  pool_4match     NUMERIC(12,2) NOT NULL DEFAULT 0,
  pool_3match     NUMERIC(12,2) NOT NULL DEFAULT 0,
  jackpot_rolled  BOOLEAN NOT NULL DEFAULT false,
  published_at    TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─── DRAW ENTRIES ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS draw_entries (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  draw_id      UUID NOT NULL REFERENCES draws(id) ON DELETE CASCADE,
  user_id      UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  user_scores  INTEGER[] NOT NULL,
  match_count  INTEGER CHECK (match_count IN (3, 4, 5)),
  prize_amount NUMERIC(12,2),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (draw_id, user_id)
);

-- ─── WINNER VERIFICATIONS ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS winner_verifications (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  draw_entry_id UUID NOT NULL UNIQUE REFERENCES draw_entries(id) ON DELETE CASCADE,
  user_id       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  proof_url     TEXT NOT NULL,
  status        TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  admin_notes   TEXT,
  payout_status TEXT NOT NULL DEFAULT 'pending' CHECK (payout_status IN ('pending', 'paid')),
  reviewed_at   TIMESTAMPTZ,
  paid_at       TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─── CHARITY CONTRIBUTIONS ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS charity_contributions (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  charity_id        UUID NOT NULL REFERENCES charities(id) ON DELETE CASCADE,
  amount            NUMERIC(12,2) NOT NULL,
  contribution_type TEXT NOT NULL DEFAULT 'subscription' CHECK (contribution_type IN ('subscription', 'independent')),
  stripe_payment_id TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─── PRIZE POOL CONFIG (single row) ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS prize_pool_config (
  id                    INTEGER PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  monthly_price_cents   INTEGER NOT NULL DEFAULT 999,
  yearly_price_cents    INTEGER NOT NULL DEFAULT 9999,
  pool_percentage       NUMERIC(5,2) NOT NULL DEFAULT 70.00,
  charity_min_pct       INTEGER NOT NULL DEFAULT 10,
  jackpot_share_pct     NUMERIC(5,2) NOT NULL DEFAULT 40.00,
  four_match_share_pct  NUMERIC(5,2) NOT NULL DEFAULT 35.00,
  three_match_share_pct NUMERIC(5,2) NOT NULL DEFAULT 25.00
);

-- Seed single config row
INSERT INTO prize_pool_config DEFAULT VALUES ON CONFLICT (id) DO NOTHING;

-- ─── INDEXES ─────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_scores_user_date     ON scores (user_id, score_date DESC);
CREATE INDEX IF NOT EXISTS idx_draw_entries_draw    ON draw_entries (draw_id);
CREATE INDEX IF NOT EXISTS idx_draw_entries_user    ON draw_entries (user_id);
CREATE INDEX IF NOT EXISTS idx_users_stripe         ON users (stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_users_subscription   ON users (subscription_status);
CREATE INDEX IF NOT EXISTS idx_contributions_user   ON charity_contributions (user_id);
CREATE INDEX IF NOT EXISTS idx_contributions_charity ON charity_contributions (charity_id);
CREATE INDEX IF NOT EXISTS idx_winner_v_user        ON winner_verifications (user_id);

-- ─── ROW LEVEL SECURITY ───────────────────────────────────────────────────────
ALTER TABLE users                  ENABLE ROW LEVEL SECURITY;
ALTER TABLE scores                 ENABLE ROW LEVEL SECURITY;
ALTER TABLE draws                  ENABLE ROW LEVEL SECURITY;
ALTER TABLE draw_entries           ENABLE ROW LEVEL SECURITY;
ALTER TABLE winner_verifications   ENABLE ROW LEVEL SECURITY;
ALTER TABLE charity_contributions  ENABLE ROW LEVEL SECURITY;
ALTER TABLE charities              ENABLE ROW LEVEL SECURITY;
ALTER TABLE prize_pool_config      ENABLE ROW LEVEL SECURITY;

-- ─── RLS POLICIES ─────────────────────────────────────────────────────────────

-- users: own row only
CREATE POLICY "users_select_own" ON users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "users_insert_own" ON users FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "users_update_own" ON users FOR UPDATE USING (auth.uid() = id);

-- Admin bypass for users table (service role bypasses RLS automatically)

-- scores: own rows only
CREATE POLICY "scores_select_own" ON scores FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "scores_insert_own" ON scores FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "scores_update_own" ON scores FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "scores_delete_own" ON scores FOR DELETE USING (auth.uid() = user_id);

-- draws: readable by all authenticated users
CREATE POLICY "draws_select_auth" ON draws FOR SELECT USING (auth.role() = 'authenticated');

-- draw_entries: own rows only
CREATE POLICY "draw_entries_select_own" ON draw_entries FOR SELECT USING (auth.uid() = user_id);

-- winner_verifications: own rows only
CREATE POLICY "winner_v_select_own" ON winner_verifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "winner_v_insert_own" ON winner_verifications FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "winner_v_update_own" ON winner_verifications FOR UPDATE USING (auth.uid() = user_id);

-- charities: public read
CREATE POLICY "charities_select_public" ON charities FOR SELECT USING (true);

-- charity_contributions: own rows only
CREATE POLICY "contributions_select_own" ON charity_contributions FOR SELECT USING (auth.uid() = user_id);

-- prize_pool_config: public read
CREATE POLICY "config_select_public" ON prize_pool_config FOR SELECT USING (true);

-- ─── TRIGGER: auto-create user profile on signup ──────────────────────────────
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO users (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data ->> 'full_name'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ─── TRIGGER: updated_at ───────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

DROP TRIGGER IF EXISTS users_updated_at ON users;
CREATE TRIGGER users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ─── STORAGE BUCKETS (run in Supabase dashboard or via API) ───────────────────
-- Create these two public buckets in Storage settings:
--   1. "charity-images"  — public, 5MB max, images only
--   2. "winner-proofs"   — public, 5MB max, images only

-- ─── SEED: Admin user (update email to match ADMIN_EMAIL env var) ─────────────
-- After creating the admin user via Supabase Auth, run:
-- UPDATE users SET role = 'admin' WHERE email = 'admin@yourdomain.com';

-- ─── SEED: Sample charities ───────────────────────────────────────────────────
INSERT INTO charities (name, description, website_url, is_featured, is_active) VALUES
  ('Irish Cancer Society',      'Ireland''s leading cancer charity, funding research and supporting patients.', 'https://www.cancer.ie', true, true),
  ('RNLI',                      'The charity that saves lives at sea around the coasts of the UK and Ireland.', 'https://rnli.org', true, true),
  ('St. Vincent de Paul',       'Helping people in need across Ireland with practical support and friendship.', 'https://www.svp.ie', true, true),
  ('Aware',                     'Supporting people affected by depression and bipolar disorder in Ireland.', 'https://www.aware.ie', false, true),
  ('Enable Ireland',            'Providing services to children and adults with disabilities across Ireland.', 'https://www.enableireland.ie', false, true),
  ('Pieta House',               'Suicide and self-harm crisis intervention, therapy and suicide bereavement.', 'https://www.pieta.ie', false, true),
  ('Irish Guide Dogs',          'Training guide dogs for people with sight loss and autism assistance dogs.', 'https://www.guidedogs.ie', false, true),
  ('Age Action Ireland',        'Working with and for older people to achieve better lives.', 'https://www.ageaction.ie', false, true)
ON CONFLICT DO NOTHING;
