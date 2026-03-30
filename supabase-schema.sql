-- ============================================================
-- Golf Charity Platform — Supabase Schema
-- Run this in the Supabase SQL Editor
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ── USERS (extends Supabase auth.users) ─────────────────────
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  avatar_url TEXT,
  handicap INTEGER,
  role TEXT NOT NULL DEFAULT 'subscriber' CHECK (role IN ('subscriber', 'admin')),
  subscription_status TEXT DEFAULT 'inactive' CHECK (
    subscription_status IN ('active', 'inactive', 'cancelled', 'past_due')
  ),
  subscription_plan TEXT CHECK (subscription_plan IN ('monthly', 'yearly')),
  subscription_id TEXT, -- razorpay subscription ID
  subscription_ends_at TIMESTAMPTZ,
  razorpay_customer_id TEXT UNIQUE,
  charity_id UUID,
  charity_percentage INTEGER DEFAULT 10 CHECK (charity_percentage BETWEEN 10 AND 100),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── CHARITIES ────────────────────────────────────────────────
CREATE TABLE public.charities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT NOT NULL,
  short_description TEXT,
  image_url TEXT,
  website_url TEXT,
  is_featured BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  total_raised DECIMAL(12,2) DEFAULT 0,
  upcoming_events JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add FK from profiles to charities
ALTER TABLE public.profiles
  ADD CONSTRAINT fk_profile_charity
  FOREIGN KEY (charity_id) REFERENCES public.charities(id);

-- ── GOLF SCORES ──────────────────────────────────────────────
CREATE TABLE public.golf_scores (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  score INTEGER NOT NULL CHECK (score BETWEEN 1 AND 45),
  played_at DATE NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast user score lookups
CREATE INDEX idx_golf_scores_user ON public.golf_scores(user_id, played_at DESC);

-- ── DRAWS ────────────────────────────────────────────────────
CREATE TABLE public.draws (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  draw_month DATE NOT NULL, -- First day of the month
  draw_type TEXT NOT NULL DEFAULT 'random' CHECK (draw_type IN ('random', 'algorithmic')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'simulated', 'published')),
  winning_numbers INTEGER[] NOT NULL DEFAULT '{}', -- 5 numbers 1-45
  prize_pool_total DECIMAL(12,2) NOT NULL DEFAULT 0,
  prize_pool_5match DECIMAL(12,2) DEFAULT 0,
  prize_pool_4match DECIMAL(12,2) DEFAULT 0,
  prize_pool_3match DECIMAL(12,2) DEFAULT 0,
  jackpot_carried_over DECIMAL(12,2) DEFAULT 0,
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── DRAW ENTRIES ─────────────────────────────────────────────
CREATE TABLE public.draw_entries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  draw_id UUID NOT NULL REFERENCES public.draws(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  numbers_entered INTEGER[] NOT NULL, -- User's 5 most recent scores at draw time
  match_count INTEGER DEFAULT 0,
  prize_tier TEXT CHECK (prize_tier IN ('5-match', '4-match', '3-match')),
  prize_amount DECIMAL(12,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(draw_id, user_id)
);

-- ── WINNERS ──────────────────────────────────────────────────
CREATE TABLE public.winners (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  draw_id UUID NOT NULL REFERENCES public.draws(id),
  user_id UUID NOT NULL REFERENCES public.profiles(id),
  prize_tier TEXT NOT NULL CHECK (prize_tier IN ('5-match', '4-match', '3-match')),
  prize_amount DECIMAL(12,2) NOT NULL,
  proof_url TEXT,
  verification_status TEXT DEFAULT 'pending' CHECK (
    verification_status IN ('pending', 'approved', 'rejected')
  ),
  payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid')),
  admin_notes TEXT,
  verified_at TIMESTAMPTZ,
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── CHARITY CONTRIBUTIONS ────────────────────────────────────
CREATE TABLE public.charity_contributions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id),
  charity_id UUID NOT NULL REFERENCES public.charities(id),
  amount DECIMAL(12,2) NOT NULL,
  contribution_month DATE NOT NULL,
  razorpay_payment_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── SUBSCRIPTION EVENTS (audit log) ─────────────────────────
CREATE TABLE public.subscription_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.profiles(id),
  razorpay_event_id TEXT UNIQUE,
  event_type TEXT NOT NULL,
  payload JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ════════════════════════════════════════════════════════════
-- ROW LEVEL SECURITY
-- ════════════════════════════════════════════════════════════
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.golf_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.draw_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.winners ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.charity_contributions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.charities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.draws ENABLE ROW LEVEL SECURITY;

-- Profiles: users see own, admins see all
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Admins full access profiles"
  ON public.profiles FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Golf scores: users manage own
CREATE POLICY "Users manage own scores"
  ON public.golf_scores FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Admins view all scores"
  ON public.golf_scores FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Draw entries: users see own, admins all
CREATE POLICY "Users see own entries"
  ON public.draw_entries FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins manage entries"
  ON public.draw_entries FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Winners: users see own
CREATE POLICY "Users see own winnings"
  ON public.winners FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins manage winners"
  ON public.winners FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Charities: public read
CREATE POLICY "Public can view active charities"
  ON public.charities FOR SELECT USING (is_active = TRUE);
CREATE POLICY "Admins manage charities"
  ON public.charities FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Draws: published visible to all auth users
CREATE POLICY "Auth users see published draws"
  ON public.draws FOR SELECT USING (
    auth.uid() IS NOT NULL AND status = 'published'
  );
CREATE POLICY "Admins manage draws"
  ON public.draws FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- ════════════════════════════════════════════════════════════
-- FUNCTIONS & TRIGGERS
-- ════════════════════════════════════════════════════════════

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'Golfer'),
    COALESCE(NEW.raw_user_meta_data->>'role', 'subscriber')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Keep only 5 most recent scores per user
CREATE OR REPLACE FUNCTION public.enforce_score_limit()
RETURNS TRIGGER AS $$
BEGIN
  DELETE FROM public.golf_scores
  WHERE user_id = NEW.user_id
    AND id NOT IN (
      SELECT id FROM public.golf_scores
      WHERE user_id = NEW.user_id
      ORDER BY played_at DESC
      LIMIT 5
    );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER after_score_insert
  AFTER INSERT ON public.golf_scores
  FOR EACH ROW EXECUTE FUNCTION public.enforce_score_limit();

-- Updated_at trigger
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER profiles_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER draws_updated_at BEFORE UPDATE ON public.draws
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER winners_updated_at BEFORE UPDATE ON public.winners
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- ════════════════════════════════════════════════════════════
-- SEED DATA — Sample charities
-- ════════════════════════════════════════════════════════════
INSERT INTO public.charities (name, slug, description, short_description, image_url, website_url, is_featured) VALUES
(
  'Greenside Foundation',
  'greenside-foundation',
  'The Greenside Foundation supports mental health initiatives for young athletes, providing counselling, mentorship, and community programmes across the UK. Every pound donated goes directly to supporting young people aged 14–25 through sport and structured support.',
  'Mental health support for young athletes across the UK.',
  'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=800',
  'https://example.org',
  TRUE
),
(
  'Fairway for All',
  'fairway-for-all',
  'Fairway for All breaks down socio-economic barriers in golf by funding equipment, coaching, and course access for underprivileged communities. We believe the sport should be accessible to everyone, not just the privileged few.',
  'Making golf accessible to underprivileged communities.',
  'https://images.unsplash.com/photo-1535131749006-b7f58c99034b?w=800',
  'https://example.org',
  FALSE
),
(
  'The Par Project',
  'the-par-project',
  'The Par Project funds environmental conservation efforts on and around golf courses — restoring wildlife habitats, reducing water usage, and planting native species. We partner with courses to achieve net-zero impact.',
  'Environmental conservation through golf course partnerships.',
  'https://images.unsplash.com/photo-1501854140801-50d01698950b?w=800',
  'https://example.org',
  FALSE
),
(
  'Birdie Futures',
  'birdie-futures',
  'Birdie Futures invests in junior golf academies in schools across economically deprived areas, offering free coaching, equipment lending, and competitive pathways for children aged 8–18.',
  'Free junior golf academies for children in deprived areas.',
  'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=800',
  'https://example.org',
  FALSE
);

-- ════════════════════════════════════════════════════════════
-- Charity contributions: users see own
-- ════════════════════════════════════════════════════════════
CREATE POLICY "Users see own contributions"
  ON public.charity_contributions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "System inserts contributions"
  ON public.charity_contributions FOR INSERT WITH CHECK (TRUE);
