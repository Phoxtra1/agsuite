
-- Templates table
CREATE TABLE public.coms_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'email',
  category TEXT NOT NULL DEFAULT 'general',
  subject TEXT,
  body TEXT NOT NULL DEFAULT '',
  variables TEXT[] DEFAULT '{}',
  usage_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.coms_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own templates"
ON public.coms_templates FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER update_coms_templates_updated_at
BEFORE UPDATE ON public.coms_templates
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Inbound messages table
CREATE TABLE public.inbound_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  sender TEXT NOT NULL,
  sender_name TEXT,
  subject TEXT NOT NULL DEFAULT '',
  body TEXT NOT NULL DEFAULT '',
  channel TEXT NOT NULL DEFAULT 'email',
  type TEXT NOT NULL DEFAULT 'general',
  priority TEXT NOT NULL DEFAULT 'normal',
  source_app TEXT DEFAULT 'external',
  is_read BOOLEAN NOT NULL DEFAULT false,
  is_starred BOOLEAN NOT NULL DEFAULT false,
  is_archived BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.inbound_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own inbound messages"
ON public.inbound_messages FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER update_inbound_messages_updated_at
BEFORE UPDATE ON public.inbound_messages
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime on coms_logs
ALTER PUBLICATION supabase_realtime ADD TABLE public.coms_logs;
ALTER PUBLICATION supabase_realtime ADD TABLE public.inbound_messages;
