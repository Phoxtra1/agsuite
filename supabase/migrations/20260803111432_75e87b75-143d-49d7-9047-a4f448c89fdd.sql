CREATE TABLE public.workspace_drive_state (
  user_id uuid PRIMARY KEY,
  state_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.workspace_drive_state TO authenticated;
GRANT ALL ON public.workspace_drive_state TO service_role;

ALTER TABLE public.workspace_drive_state ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own Drive state"
ON public.workspace_drive_state FOR SELECT TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own Drive state"
ON public.workspace_drive_state FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own Drive state"
ON public.workspace_drive_state FOR UPDATE TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own Drive state"
ON public.workspace_drive_state FOR DELETE TO authenticated
USING (auth.uid() = user_id);

CREATE TRIGGER update_workspace_drive_state_updated_at
BEFORE UPDATE ON public.workspace_drive_state
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();