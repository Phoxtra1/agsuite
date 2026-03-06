-- Allow Product Registry writes from both anonymous and authenticated sessions
-- (console currently writes with anon key, which caused save/delete failures)

DROP POLICY IF EXISTS "Authenticated users can insert products" ON public.products;
DROP POLICY IF EXISTS "Authenticated users can update products" ON public.products;
DROP POLICY IF EXISTS "Authenticated users can delete products" ON public.products;

CREATE POLICY "Public users can insert products"
ON public.products
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

CREATE POLICY "Public users can update products"
ON public.products
FOR UPDATE
TO anon, authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "Public users can delete products"
ON public.products
FOR DELETE
TO anon, authenticated
USING (true);