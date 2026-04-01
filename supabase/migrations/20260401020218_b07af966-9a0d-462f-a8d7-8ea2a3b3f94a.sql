
-- ═══════════════════════════════════════════════════════════════
-- ACS DATA LAKE: Raw data from all platforms
-- ═══════════════════════════════════════════════════════════════
CREATE TABLE public.acs_raw_data (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  platform text NOT NULL,              -- agroclimate, agstock, agis, aminevaops
  dataset_type text NOT NULL,          -- weather, inventory, operations, environmental, financial
  raw_payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  metadata jsonb DEFAULT '{}'::jsonb,  -- extra context: region, device, batch_id
  ingested_at timestamptz NOT NULL DEFAULT now(),
  source_ref text,                     -- original ID in the source system
  batch_id text,                       -- links records from the same ingest batch
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ═══════════════════════════════════════════════════════════════
-- ACS PROCESSING LOGS: Tracks each normalization / AI run
-- ═══════════════════════════════════════════════════════════════
CREATE TABLE public.acs_processing_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pipeline text NOT NULL,              -- normalization, prediction, anomaly_detection
  status text NOT NULL DEFAULT 'pending',  -- pending, running, completed, failed
  input_count integer DEFAULT 0,
  output_count integer DEFAULT 0,
  started_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz,
  error_message text,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ═══════════════════════════════════════════════════════════════
-- ACS INTELLIGENCE OUTPUTS: Actionable intelligence produced by AI
-- ═══════════════════════════════════════════════════════════════
CREATE TABLE public.acs_intelligence_outputs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category text NOT NULL,              -- financial, market_commodity, agroclimate, predictive_alert, report
  title text NOT NULL,
  summary text,
  intelligence jsonb NOT NULL DEFAULT '{}'::jsonb,
  confidence numeric(5,2),             -- 0.00–100.00
  source_pipeline text,                -- which pipeline produced this
  source_platforms text[] DEFAULT '{}', -- which platforms contributed data
  valid_from timestamptz,
  valid_until timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ═══════════════════════════════════════════════════════════════
-- ACS TRANSFORMATION AUDIT: Full audit trail for data transforms
-- ═══════════════════════════════════════════════════════════════
CREATE TABLE public.acs_transformation_audit (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  raw_data_id uuid REFERENCES public.acs_raw_data(id) ON DELETE SET NULL,
  processing_log_id uuid REFERENCES public.acs_processing_logs(id) ON DELETE SET NULL,
  transform_type text NOT NULL,        -- clean, normalize, enrich, merge, deduplicate
  input_snapshot jsonb,                -- data before transform
  output_snapshot jsonb,               -- data after transform
  changes_summary text,                -- human-readable description
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ═══════════════════════════════════════════════════════════════
-- INDEXES for query performance
-- ═══════════════════════════════════════════════════════════════
CREATE INDEX idx_acs_raw_data_platform ON public.acs_raw_data(platform);
CREATE INDEX idx_acs_raw_data_dataset_type ON public.acs_raw_data(dataset_type);
CREATE INDEX idx_acs_raw_data_ingested_at ON public.acs_raw_data(ingested_at);
CREATE INDEX idx_acs_raw_data_batch_id ON public.acs_raw_data(batch_id);
CREATE INDEX idx_acs_processing_logs_pipeline ON public.acs_processing_logs(pipeline);
CREATE INDEX idx_acs_processing_logs_status ON public.acs_processing_logs(status);
CREATE INDEX idx_acs_intelligence_outputs_category ON public.acs_intelligence_outputs(category);
CREATE INDEX idx_acs_transformation_audit_raw_data_id ON public.acs_transformation_audit(raw_data_id);

-- ═══════════════════════════════════════════════════════════════
-- RLS POLICIES
-- ═══════════════════════════════════════════════════════════════
ALTER TABLE public.acs_raw_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.acs_processing_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.acs_intelligence_outputs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.acs_transformation_audit ENABLE ROW LEVEL SECURITY;

-- Service role has full access (edge functions use service role)
CREATE POLICY "Service role full access on acs_raw_data"
  ON public.acs_raw_data FOR ALL TO service_role
  USING (true) WITH CHECK (true);

CREATE POLICY "Service role full access on acs_processing_logs"
  ON public.acs_processing_logs FOR ALL TO service_role
  USING (true) WITH CHECK (true);

CREATE POLICY "Service role full access on acs_intelligence_outputs"
  ON public.acs_intelligence_outputs FOR ALL TO service_role
  USING (true) WITH CHECK (true);

CREATE POLICY "Service role full access on acs_transformation_audit"
  ON public.acs_transformation_audit FOR ALL TO service_role
  USING (true) WITH CHECK (true);

-- Authenticated users can READ intelligence outputs and processing logs
CREATE POLICY "Authenticated can read intelligence outputs"
  ON public.acs_intelligence_outputs FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Authenticated can read processing logs"
  ON public.acs_processing_logs FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Authenticated can read raw data"
  ON public.acs_raw_data FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Authenticated can read transformation audit"
  ON public.acs_transformation_audit FOR SELECT TO authenticated
  USING (true);

-- Enable realtime for intelligence outputs (for dashboard alerts)
ALTER PUBLICATION supabase_realtime ADD TABLE public.acs_intelligence_outputs;
ALTER PUBLICATION supabase_realtime ADD TABLE public.acs_processing_logs;
