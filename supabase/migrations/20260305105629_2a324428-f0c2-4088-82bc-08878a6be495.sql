
-- Products table for permanent storage
CREATE TABLE public.products (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  short_name TEXT,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'coming_soon',
  url TEXT,
  admin_url TEXT,
  category TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_public BOOLEAN DEFAULT false,
  is_external BOOLEAN DEFAULT false,
  product_type TEXT NOT NULL DEFAULT 'category',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- Everyone can read products (public data)
CREATE POLICY "Products are publicly readable"
  ON public.products FOR SELECT
  TO anon, authenticated
  USING (true);

-- Only authenticated users can modify (admin check done in app)
CREATE POLICY "Authenticated users can insert products"
  ON public.products FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update products"
  ON public.products FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete products"
  ON public.products FOR DELETE
  TO authenticated
  USING (true);

-- Updated_at trigger
CREATE TRIGGER update_products_updated_at
  BEFORE UPDATE ON public.products
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Seed default data
-- Admin products (product_type = 'admin')
INSERT INTO public.products (id, name, short_name, description, status, admin_url, sort_order, product_type) VALUES
  ('agis-admin', 'AGIS', 'AGIS', 'Amineva Global Intelligence Service', 'live', 'https://app.amineva.com/admin', 1, 'admin'),
  ('amniva-admin', 'Amniva', 'Amniva', 'Market trends, verification & prediction', 'live', 'https://amniva.io/admin', 2, 'admin'),
  ('phoxtra-admin', 'Phoxtra', 'Phoxtra', '', 'live', 'https://phoxtra.com/admin', 3, 'admin'),
  ('agroclimate-admin', 'AgroClimate', 'AgroClimate', 'Real-time weather & agricultural advisory', 'live', 'https://agro.amineva.com/admin', 4, 'admin');

-- Category products (product_type = 'category') - shown on homepage
INSERT INTO public.products (id, name, short_name, description, status, url, sort_order, product_type) VALUES
  ('agis', 'AGIS', 'AGIS', 'Amineva Global Intelligence Service', 'live', 'https://app.amineva.com', 1, 'category'),
  ('amniva', 'Amniva', 'Amniva', 'Market trends, verification & prediction', 'live', 'https://amniva.io', 2, 'category'),
  ('aminevaops', 'AminevaOps', 'Ops', 'Scalable operational tools for teams', 'coming_soon', '', 3, 'category');
