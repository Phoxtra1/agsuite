// src/core/backend/acs.ts
// PURPOSE: Centralized event & data ingestion layer + intelligence infrastructure types.

export interface ACSEvent {
  id: string;
  source: string;
  type: string;
  payload: Record<string, any>;
  user_id?: string | null;
  created_at: string;
}

export interface ACSSyncLog {
  id: string;
  source: string;
  status: string;
  records_synced: number | null;
  started_at: string;
  completed_at: string | null;
  error_message: string | null;
  user_id?: string | null;
  created_at: string;
}

// ── Phase 1: Data Lake ──────────────────────────────────────────────────
export interface ACSRawData {
  id: string;
  platform: string;
  dataset_type: string;
  raw_payload: Record<string, any>;
  metadata: Record<string, any>;
  ingested_at: string;
  source_ref: string | null;
  batch_id: string | null;
  created_at: string;
}

export interface ACSProcessingLog {
  id: string;
  pipeline: string;
  status: string;
  input_count: number;
  output_count: number;
  started_at: string;
  completed_at: string | null;
  error_message: string | null;
  metadata: Record<string, any>;
  created_at: string;
}

export interface ACSIntelligenceOutput {
  id: string;
  category: string;
  title: string;
  summary: string | null;
  intelligence: Record<string, any>;
  confidence: number | null;
  source_pipeline: string | null;
  source_platforms: string[];
  valid_from: string | null;
  valid_until: string | null;
  created_at: string;
}

// ── Phase 2: Transformation Audit ───────────────────────────────────────
export interface ACSTransformationAudit {
  id: string;
  raw_data_id: string | null;
  processing_log_id: string | null;
  transform_type: string;
  input_snapshot: Record<string, any> | null;
  output_snapshot: Record<string, any> | null;
  changes_summary: string | null;
  created_at: string;
}

export interface ACSAdapter {
  // Legacy event layer
  sendEvent(event: {
    source: string;
    type: string;
    payload: Record<string, any>;
    timestamp?: number;
  }): Promise<void>;

  fetchEvents(filters?: {
    source?: string;
    search?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ data: ACSEvent[]; count: number }>;

  fetchSyncLogs(source?: string): Promise<ACSSyncLog[]>;
  triggerSync(source: string): Promise<ACSSyncLog>;
  subscribeEvents(callback: (event: ACSEvent) => void): () => void;

  // Phase 1: Data Lake
  fetchRawData(filters?: {
    platform?: string;
    dataset_type?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ data: ACSRawData[]; count: number }>;

  fetchProcessingLogs(filters?: {
    pipeline?: string;
    status?: string;
    limit?: number;
  }): Promise<ACSProcessingLog[]>;

  fetchIntelligence(filters?: {
    category?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ data: ACSIntelligenceOutput[]; count: number }>;

  // Phase 2: Audit
  fetchTransformationAudit(filters?: {
    raw_data_id?: string;
    processing_log_id?: string;
    limit?: number;
  }): Promise<ACSTransformationAudit[]>;

  // Realtime for intelligence
  subscribeIntelligence(callback: (output: ACSIntelligenceOutput) => void): () => void;
}
