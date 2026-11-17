-- ========================================================
-- NEVA FASHION PLATFORM - SUPABASE DATABASE SCHEMA
-- ========================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. PROFILES (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  province TEXT DEFAULT 'Luanda',
  municipality TEXT,
  role TEXT DEFAULT 'customer' CHECK (role IN ('customer', 'admin')),
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. CATEGORIES
CREATE TABLE IF NOT EXISTS public.categories (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  label TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  image_url TEXT,
  description TEXT,
  display_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed default NEVA categories
INSERT INTO public.categories (id, name, label, slug, display_order) VALUES
  ('t-shirts', 'T-Shirts', 'T-Shirts', 't-shirts', 1),
  ('tenis', 'Ténis', 'Ténis', 'tenis', 2),
  ('casacos', 'Casacos', 'Casacos', 'casacos', 3),
  ('chapeus', 'Chapéus', 'Chapéus', 'chapeus', 4)
ON CONFLICT (id) DO NOTHING;

-- 3. PRODUCTS
CREATE TABLE IF NOT EXISTS public.products (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  price NUMERIC(12, 2) NOT NULL,
  original_price NUMERIC(12, 2),
  description TEXT,
  category_id TEXT REFERENCES public.categories(id) ON DELETE SET NULL,
  images TEXT[] DEFAULT ARRAY[]::TEXT[],
  sizes TEXT[] DEFAULT ARRAY['S', 'M', 'L', 'XL']::TEXT[],
  colors JSONB DEFAULT '[]'::JSONB,
  stock_quantity INT DEFAULT 10,
  is_featured BOOLEAN DEFAULT false,
  is_new_arrival BOOLEAN DEFAULT false,
  rating NUMERIC(3, 2) DEFAULT 5.0,
  reviews_count INT DEFAULT 0,
  tags TEXT[] DEFAULT ARRAY[]::TEXT[],
  details JSONB DEFAULT '{}'::JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. SAVED ADDRESSES
CREATE TABLE IF NOT EXISTS public.addresses (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  label TEXT DEFAULT 'Casa',
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  province TEXT NOT NULL,
  municipality TEXT NOT NULL,
  address TEXT NOT NULL,
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. ORDERS
CREATE TABLE IF NOT EXISTS public.orders (
  id TEXT PRIMARY KEY,
  order_number TEXT UNIQUE NOT NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  customer_name TEXT NOT NULL,
  customer_email TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  province TEXT NOT NULL,
  municipality TEXT NOT NULL,
  address TEXT NOT NULL,
  payment_method TEXT NOT NULL CHECK (payment_method IN ('transfer', 'delivery', 'multicaixa_express')),
  payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'verified')),
  order_status TEXT DEFAULT 'pending' CHECK (order_status IN ('pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled')),
  subtotal NUMERIC(12, 2) NOT NULL,
  shipping_fee NUMERIC(12, 2) NOT NULL,
  total NUMERIC(12, 2) NOT NULL,
  payment_proof_url TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. ORDER ITEMS
CREATE TABLE IF NOT EXISTS public.order_items (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  order_id TEXT REFERENCES public.orders(id) ON DELETE CASCADE NOT NULL,
  product_id TEXT REFERENCES public.products(id) ON DELETE SET NULL,
  product_name TEXT NOT NULL,
  product_image TEXT,
  size TEXT NOT NULL,
  color_name TEXT NOT NULL,
  color_hex TEXT,
  unit_price NUMERIC(12, 2) NOT NULL,
  quantity INT NOT NULL CHECK (quantity > 0),
  subtotal NUMERIC(12, 2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. FAVORITES
CREATE TABLE IF NOT EXISTS public.favorites (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  product_id TEXT REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, product_id)
);

-- ========================================================
-- AUTO-CREATE PROFILE ON SIGNUP
-- ========================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email, phone, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'phone', ''),
    'customer'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- ========================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ========================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;

-- Products & Categories
DROP POLICY IF EXISTS "Public products viewable by all" ON public.products;
DROP POLICY IF EXISTS "Public categories viewable by all" ON public.categories;
DROP POLICY IF EXISTS "Manage products" ON public.products;

CREATE POLICY "Public products viewable by all" ON public.products FOR SELECT USING (true);
CREATE POLICY "Public categories viewable by all" ON public.categories FOR SELECT USING (true);
CREATE POLICY "Manage products" ON public.products FOR ALL USING (true) WITH CHECK (true);

-- Profiles
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;

CREATE POLICY "Users can view their own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert their own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Addresses
DROP POLICY IF EXISTS "Users can manage their addresses" ON public.addresses;
CREATE POLICY "Users can manage their addresses" ON public.addresses FOR ALL USING (auth.uid() = user_id);

-- Orders & Order Items
DROP POLICY IF EXISTS "Anyone can view orders" ON public.orders;
DROP POLICY IF EXISTS "Anyone can create an order" ON public.orders;
DROP POLICY IF EXISTS "Anyone can update orders" ON public.orders;

CREATE POLICY "Anyone can view orders" ON public.orders FOR SELECT USING (true);
CREATE POLICY "Anyone can create an order" ON public.orders FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update orders" ON public.orders FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Order items viewable" ON public.order_items;
DROP POLICY IF EXISTS "Order items insertable on checkout" ON public.order_items;

CREATE POLICY "Order items viewable" ON public.order_items FOR SELECT USING (true);
CREATE POLICY "Order items insertable on checkout" ON public.order_items FOR INSERT WITH CHECK (true);

-- Favorites
DROP POLICY IF EXISTS "Users can manage favorites" ON public.favorites;
CREATE POLICY "Users can manage favorites" ON public.favorites FOR ALL USING (auth.uid() = user_id);

-- ========================================================
-- SUPABASE STORAGE BUCKET & POLICIES ('neva-products')
-- ========================================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('neva-products', 'neva-products', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Public Access neva-products" ON storage.objects;
DROP POLICY IF EXISTS "Public Upload neva-products" ON storage.objects;
DROP POLICY IF EXISTS "Public Update neva-products" ON storage.objects;
DROP POLICY IF EXISTS "Public Delete neva-products" ON storage.objects;

CREATE POLICY "Public Access neva-products"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'neva-products');

CREATE POLICY "Public Upload neva-products"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'neva-products');

CREATE POLICY "Public Update neva-products"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'neva-products');

CREATE POLICY "Public Delete neva-products"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'neva-products');

