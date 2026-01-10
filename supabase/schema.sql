-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- --- TYPES (ENUMS) ---
DO $$ BEGIN
    CREATE TYPE public.user_plan AS ENUM ('free', 'basic', 'advanced', 'premium');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE public.ad_status AS ENUM ('pending', 'active', 'rejected', 'sold', 'paused');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 1. PROFILES (Extends auth.users)
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT NOT NULL,
  active_plan public.user_plan NOT NULL DEFAULT 'free',
  plan_expires_at TIMESTAMPTZ,
  mp_customer_id TEXT,
  
  -- Metadata extra (Name, avatar, etc)
  name TEXT,
  avatar_url TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS for Profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Policy: Public read (needed for presenting seller info on ads)
CREATE POLICY "Public profiles are viewable" 
ON public.profiles FOR SELECT 
USING (true);

-- Policy: UPDATE ONLY via Service Role (Users cannot change their plan directly)
-- We strictly BLOCK update from Auth Users. Only Postgres Admin or Service Role can update.
-- No UPDATE policy for public/authenticated role.

-- 2. ADS
CREATE TABLE public.ads (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) NOT NULL,
  category TEXT NOT NULL,
  status public.ad_status NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Content
  title TEXT NOT NULL,
  description TEXT,
  price DECIMAL(12, 2) NOT NULL,
  image TEXT,
  location TEXT,
  details JSONB, -- Flexible schema for Vehicle/RealEstate specifics
  boost_plan TEXT DEFAULT 'none',
  
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS for Ads
ALTER TABLE public.ads ENABLE ROW LEVEL SECURITY;

-- Policy: Public view 'active' only
CREATE POLICY "Public view active ads" 
ON public.ads FOR SELECT 
USING (status = 'active');

-- Policy: Users view OWN ads (all statuses)
CREATE POLICY "Users view own ads" 
ON public.ads FOR SELECT 
USING (auth.uid() = user_id);

-- Policy: INSERT ONLY via Service Role (Edge Function)
-- No INSERT policy for 'authenticated'. 

-- Policy: Users can UPDATE specific fields (e.g. price) but NOT status (moderation)
CREATE POLICY "Users update own ads" 
ON public.ads FOR UPDATE 
USING (auth.uid() = user_id);


-- 3. PAYMENTS
CREATE TABLE public.payments (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) NOT NULL,
  mp_payment_id TEXT UNIQUE NOT NULL,
  status TEXT NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  plan_type TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  metadata JSONB
);

-- RLS for Payments
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- Policy: Users view their own logs
CREATE POLICY "Users view own payments" 
ON public.payments FOR SELECT 
USING (auth.uid() = user_id);

-- Trigger to create profile
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, name, avatar_url)
  VALUES (new.id, new.email, new.raw_user_meta_data->>'name', new.raw_user_meta_data->>'avatar_url');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
