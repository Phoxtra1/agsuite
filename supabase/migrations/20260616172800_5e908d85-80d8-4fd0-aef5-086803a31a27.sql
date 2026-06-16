
-- ===========================================================
-- 1. Register Workspace as an application
-- ===========================================================
INSERT INTO public.applications (app_slug, app_name, app_key, app_type, status)
VALUES ('workspace', 'Workspace', 'workspace', 'product', 'active')
ON CONFLICT (app_slug) DO NOTHING;

-- ===========================================================
-- 2. Register Workspace in the homepage product category list
-- ===========================================================
INSERT INTO public.products (id, name, short_name, description, status, url, category, sort_order, is_public, is_external, product_type)
VALUES (
  'workspace',
  'Workspace',
  'Workspace',
  'Unified productivity & data-intelligence hub — AG Docs, Sheets, Slides, Forms, Drive.',
  'live',
  '/workspace',
  'business-intelligence',
  10,
  true,
  false,
  'category'
)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  status = EXCLUDED.status,
  url = EXCLUDED.url,
  category = EXCLUDED.category;

-- ===========================================================
-- 3. workspace_documents
-- ===========================================================
CREATE TABLE public.workspace_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL DEFAULT 'Untitled document',
  content_json jsonb NOT NULL DEFAULT '{"type":"doc","content":[]}'::jsonb,
  content_text text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.workspace_documents TO authenticated;
GRANT ALL ON public.workspace_documents TO service_role;

ALTER TABLE public.workspace_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners manage their documents"
  ON public.workspace_documents
  FOR ALL
  TO authenticated
  USING (owner_id = auth.uid())
  WITH CHECK (owner_id = auth.uid());

CREATE TRIGGER workspace_documents_updated_at
  BEFORE UPDATE ON public.workspace_documents
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX workspace_documents_owner_idx ON public.workspace_documents(owner_id, updated_at DESC);

-- ===========================================================
-- 4. workspace_document_versions
-- ===========================================================
CREATE TABLE public.workspace_document_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id uuid NOT NULL REFERENCES public.workspace_documents(id) ON DELETE CASCADE,
  content_json jsonb NOT NULL,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, DELETE ON public.workspace_document_versions TO authenticated;
GRANT ALL ON public.workspace_document_versions TO service_role;

ALTER TABLE public.workspace_document_versions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners manage versions of their documents"
  ON public.workspace_document_versions
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.workspace_documents d
      WHERE d.id = document_id AND d.owner_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.workspace_documents d
      WHERE d.id = document_id AND d.owner_id = auth.uid()
    )
  );

CREATE INDEX workspace_document_versions_doc_idx ON public.workspace_document_versions(document_id, created_at DESC);

-- ===========================================================
-- 5. workspace_document_shares
-- ===========================================================
CREATE TABLE public.workspace_document_shares (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id uuid NOT NULL REFERENCES public.workspace_documents(id) ON DELETE CASCADE,
  token text NOT NULL UNIQUE,
  mode text NOT NULL DEFAULT 'view' CHECK (mode IN ('view', 'edit')),
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  revoked boolean NOT NULL DEFAULT false,
  expires_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.workspace_document_shares TO authenticated;
GRANT ALL ON public.workspace_document_shares TO service_role;

ALTER TABLE public.workspace_document_shares ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners manage shares for their documents"
  ON public.workspace_document_shares
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.workspace_documents d
      WHERE d.id = document_id AND d.owner_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.workspace_documents d
      WHERE d.id = document_id AND d.owner_id = auth.uid()
    )
  );

-- ===========================================================
-- 6. Public share resolver (read)
-- ===========================================================
CREATE OR REPLACE FUNCTION public.get_shared_document(_token text)
RETURNS TABLE (
  id uuid,
  title text,
  content_json jsonb,
  mode text,
  updated_at timestamptz
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT d.id, d.title, d.content_json, s.mode, d.updated_at
  FROM public.workspace_document_shares s
  JOIN public.workspace_documents d ON d.id = s.document_id
  WHERE s.token = _token
    AND s.revoked = false
    AND (s.expires_at IS NULL OR s.expires_at > now())
  LIMIT 1;
$$;

GRANT EXECUTE ON FUNCTION public.get_shared_document(text) TO anon, authenticated;

-- ===========================================================
-- 7. Public share writer (edit-mode only)
-- ===========================================================
CREATE OR REPLACE FUNCTION public.update_shared_document(
  _token text,
  _content_json jsonb,
  _content_text text,
  _title text DEFAULT NULL
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  d_id uuid;
BEGIN
  SELECT d.id INTO d_id
  FROM public.workspace_document_shares s
  JOIN public.workspace_documents d ON d.id = s.document_id
  WHERE s.token = _token
    AND s.mode = 'edit'
    AND s.revoked = false
    AND (s.expires_at IS NULL OR s.expires_at > now())
  LIMIT 1;

  IF d_id IS NULL THEN
    RETURN false;
  END IF;

  UPDATE public.workspace_documents
  SET content_json = _content_json,
      content_text = _content_text,
      title = COALESCE(_title, title),
      updated_at = now()
  WHERE id = d_id;

  RETURN true;
END;
$$;

GRANT EXECUTE ON FUNCTION public.update_shared_document(text, jsonb, text, text) TO anon, authenticated;
