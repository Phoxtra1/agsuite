// src/core/backend/acs.ts
// PURPOSE: Centralized event & data ingestion layer.

export interface ACSAdapter {
  sendEvent(event: {
    source: string
    type: string
    payload: Record<string, any>
    timestamp?: number
  }): Promise<void>
}
