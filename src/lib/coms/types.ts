/** ComsSystem – Single source of truth for all types */

export type ComsChannel = 'email' | 'ticket' | 'notification';
export type ComsDirection = 'inbound' | 'outbound' | 'internal';
export type ComsPriority = 'high' | 'medium' | 'low';

export type ComsMessageStatus =
  | 'unread'
  | 'read'
  | 'pending_reply'
  | 'replied'
  | 'queued'
  | 'sent'
  | 'delivered'
  | 'failed'
  | 'archived';

export type ComsThreadStatus =
  | 'open'
  | 'pending_reply'
  | 'resolved'
  | 'closed'
  | 'archived';

export interface ComsMessage {
  id: string;
  tenantId: string;
  suiteKey: string;
  threadId: string;
  channel: ComsChannel;
  direction: ComsDirection;
  from: string;
  to: string;
  subject: string;
  body: string;
  status: ComsMessageStatus;
  createdAt: string;
  updatedAt: string;
  providerMessageId?: string;
  priority?: ComsPriority;
  meta?: Record<string, unknown>;
}

export interface ComsThread {
  threadId: string;
  suiteKey: string;
  tenantId: string;
  title: string;
  status: ComsThreadStatus;
  priority: ComsPriority;
  lastMessageAt: string;
  participants: string[];
  messages: ComsMessage[];
}

export interface ComsLogEntry {
  id: string;
  timestamp: string;
  event: 'delivered' | 'bounced' | 'failed' | 'queued' | 'opened' | 'clicked';
  channel: ComsChannel;
  recipient: string;
  subject: string;
  suiteKey: string;
  messageType: 'transactional' | 'marketing' | 'support' | 'system';
  details?: string;
}

export interface ComsTemplate {
  id: string;
  name: string;
  type: 'transactional' | 'notification' | 'marketing';
  category: string;
  description: string;
  subject: string;
  body: string;
  variables: string[];
  lastUpdated: string;
  usageCount: number;
}

export interface ComsCampaign {
  id: string;
  name: string;
  status: 'active' | 'scheduled' | 'completed' | 'draft' | 'paused';
  type: string;
  audience: number;
  sent: number;
  delivered: number;
  opened: number;
  clicked: number;
  scheduledAt: string | null;
  createdAt: string;
}

/** Filter params for listing endpoints */
export interface ComsListFilters {
  suiteKey?: string;
  channel?: ComsChannel;
  status?: string;
  search?: string;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  limit?: number;
}

/** Standard API error shape */
export interface ComsApiError {
  message: string;
  code?: string;
}

/** Health check response */
export interface ComsHealthResponse {
  ok: boolean;
  timestamp?: string;
  version?: string;
}

/** KPI stats computed from data */
export interface ComsKpiStats {
  unread: number;
  pendingReplies: number;
  sentToday: number;
  deliveryRate: number;
}

/** Available suite keys */
export const SUITE_KEYS = [
  { value: 'agstock', label: 'AGStock' },
  { value: 'phoxtra', label: 'Phoxtra' },
  { value: 'amineva-console', label: 'Amineva Console' },
  { value: 'aghub', label: 'AGHub' },
  { value: 'agis', label: 'AGIS' },
] as const;

export type SuiteKeyValue = (typeof SUITE_KEYS)[number]['value'];
