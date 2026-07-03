
CREATE TABLE public.workspace_sheets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL DEFAULT 'Untitled sheet',
  workbook_json JSONB NOT NULL DEFAULT '{"sheets":[{"name":"Sheet1","cells":{}}]}'::jsonb,
  content_text TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.workspace_sheets TO authenticated;
GRANT ALL ON public.workspace_sheets TO service_role;

ALTER TABLE public.workspace_sheets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners manage their sheets"
  ON public.workspace_sheets FOR ALL
  USING (auth.uid() = owner_id)
  WITH CHECK (auth.uid() = owner_id);

CREATE TRIGGER update_workspace_sheets_updated_at
  BEFORE UPDATE ON public.workspace_sheets
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.workspace_sheet_shares (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  sheet_id UUID NOT NULL REFERENCES public.workspace_sheets(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE,
  mode TEXT NOT NULL DEFAULT 'view' CHECK (mode IN ('view','edit')),
  revoked BOOLEAN NOT NULL DEFAULT false,
  expires_at TIMESTAMPTZ,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.workspace_sheet_shares TO authenticated;
GRANT ALL ON public.workspace_sheet_shares TO service_role;

ALTER TABLE public.workspace_sheet_shares ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Sheet owners manage shares"
  ON public.workspace_sheet_shares FOR ALL
  USING (EXISTS (SELECT 1 FROM public.workspace_sheets s WHERE s.id = sheet_id AND s.owner_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.workspace_sheets s WHERE s.id = sheet_id AND s.owner_id = auth.uid()));

CREATE OR REPLACE FUNCTION public.get_shared_sheet(_token text)
RETURNS TABLE(id uuid, title text, workbook_json jsonb, mode text, updated_at timestamptz)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT s.id, s.title, s.workbook_json, sh.mode, s.updated_at
  FROM public.workspace_sheet_shares sh
  JOIN public.workspace_sheets s ON s.id = sh.sheet_id
  WHERE sh.token = _token
    AND sh.revoked = false
    AND (sh.expires_at IS NULL OR sh.expires_at > now())
  LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.update_shared_sheet(_token text, _workbook_json jsonb, _content_text text, _title text DEFAULT NULL)
RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE s_id uuid;
BEGIN
  SELECT s.id INTO s_id
  FROM public.workspace_sheet_shares sh
  JOIN public.workspace_sheets s ON s.id = sh.sheet_id
  WHERE sh.token = _token AND sh.mode = 'edit' AND sh.revoked = false
    AND (sh.expires_at IS NULL OR sh.expires_at > now())
  LIMIT 1;
  IF s_id IS NULL THEN RETURN false; END IF;
  UPDATE public.workspace_sheets
    SET workbook_json = _workbook_json,
        content_text = _content_text,
        title = COALESCE(_title, title),
        updated_at = now()
  WHERE id = s_id;
  RETURN true;
END;
$$;
