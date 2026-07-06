
CREATE TABLE public.workspace_slides (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL DEFAULT 'Untitled presentation',
  deck_json JSONB NOT NULL DEFAULT '{"slides":[{"id":"s1","layout":"title","background":"#ffffff","elements":[]}],"theme":{"name":"Amineva","primary":"#1E2761","accent":"#2563eb","font":"Inter"}}'::jsonb,
  content_text TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.workspace_slides TO authenticated;
GRANT ALL ON public.workspace_slides TO service_role;
ALTER TABLE public.workspace_slides ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owners manage their slides" ON public.workspace_slides FOR ALL USING (auth.uid() = owner_id) WITH CHECK (auth.uid() = owner_id);
CREATE TRIGGER update_workspace_slides_updated_at BEFORE UPDATE ON public.workspace_slides FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.workspace_slide_shares (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  deck_id UUID NOT NULL REFERENCES public.workspace_slides(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE,
  mode TEXT NOT NULL DEFAULT 'view' CHECK (mode IN ('view','edit')),
  revoked BOOLEAN NOT NULL DEFAULT false,
  expires_at TIMESTAMPTZ,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.workspace_slide_shares TO authenticated;
GRANT ALL ON public.workspace_slide_shares TO service_role;
ALTER TABLE public.workspace_slide_shares ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Slide owners manage shares" ON public.workspace_slide_shares FOR ALL
  USING (EXISTS (SELECT 1 FROM public.workspace_slides s WHERE s.id = deck_id AND s.owner_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.workspace_slides s WHERE s.id = deck_id AND s.owner_id = auth.uid()));

CREATE OR REPLACE FUNCTION public.get_shared_slides(_token text)
RETURNS TABLE(id uuid, title text, deck_json jsonb, mode text, updated_at timestamptz)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT s.id, s.title, s.deck_json, sh.mode, s.updated_at
  FROM public.workspace_slide_shares sh
  JOIN public.workspace_slides s ON s.id = sh.deck_id
  WHERE sh.token = _token AND sh.revoked = false AND (sh.expires_at IS NULL OR sh.expires_at > now())
  LIMIT 1;
$$;
