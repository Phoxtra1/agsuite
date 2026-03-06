-- Replace permissive true-policies with constrained public policies
-- so anonymous console writes work while enforcing product integrity rules.

DROP POLICY IF EXISTS "Public users can insert products" ON public.products;
DROP POLICY IF EXISTS "Public users can update products" ON public.products;
DROP POLICY IF EXISTS "Public users can delete products" ON public.products;

CREATE POLICY "Public users can insert products"
ON public.products
FOR INSERT
TO anon, authenticated
WITH CHECK (
  btrim(id) <> ''
  AND btrim(name) <> ''
  AND product_type IN ('admin', 'category')
  AND status IN ('live', 'restricted', 'offline', 'coming_soon')
);

CREATE POLICY "Public users can update products"
ON public.products
FOR UPDATE
TO anon, authenticated
USING (
  product_type IN ('admin', 'category')
)
WITH CHECK (
  btrim(id) <> ''
  AND btrim(name) <> ''
  AND product_type IN ('admin', 'category')
  AND status IN ('live', 'restricted', 'offline', 'coming_soon')
);

CREATE POLICY "Public users can delete products"
ON public.products
FOR DELETE
TO anon, authenticated
USING (
  product_type IN ('admin', 'category')
);