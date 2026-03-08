// src/core/backend/acs.ts
// PURPOSE: Centralized event & data ingestion layer.

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

export interface ACSAdapter {
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
}
