/**
 * ComsSystem API client
 * Routes through mock store when VITE_COMS_MOCK_MODE=true (default),
 * otherwise calls the real API at VITE_COMS_API_BASE.
 */
import { COMS_CONFIG } from './config';
import { mockStore } from './mockStore';
import type {
  ComsThread,
  ComsMessage,
  ComsLogEntry,
  ComsTemplate,
  ComsCampaign,
  ComsKpiStats,
  ComsListFilters,
  ComsHealthResponse,
  ComsApiError,
} from './types';

// ── internal fetch wrapper ───────────────────────────────

async function apiFetch<T>(
  path: string,
  options: RequestInit = {},
): Promise<{ data: T | null; error: ComsApiError | null }> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), COMS_CONFIG.timeoutMs);

  try {
    const res = await fetch(`${COMS_CONFIG.apiBase}${path}`, {
      ...options,
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {}),
      },
    });

    clearTimeout(timer);

    let body: unknown;
    try {
      body = await res.json();
    } catch {
      body = null;
    }

    if (!res.ok) {
      const err = body as Record<string, unknown> | null;
      return {
        data: null,
        error: {
          message: (err?.message as string) || `HTTP ${res.status}`,
          code: String(res.status),
        },
      };
    }

    return { data: body as T, error: null };
  } catch (err: unknown) {
    clearTimeout(timer);
    const message =
      err instanceof DOMException && err.name === 'AbortError'
        ? 'Request timed out'
        : err instanceof Error
          ? err.message
          : 'Network error';
    return { data: null, error: { message, code: 'NETWORK_ERROR' } };
  }
}

// ── simulate network delay for mock ──────────────────────

function mockDelay(): Promise<void> {
  return new Promise((r) => setTimeout(r, 120 + Math.random() * 200));
}

// ── public API ───────────────────────────────────────────

export async function healthCheck(): Promise<{
  data: ComsHealthResponse | null;
  error: ComsApiError | null;
}> {
  if (COMS_CONFIG.mockMode) {
    await mockDelay();
    return { data: mockStore.healthCheck(), error: null };
  }
  return apiFetch<ComsHealthResponse>('/health');
}

export async function listThreads(
  filters: ComsListFilters = {},
): Promise<{ data: ComsThread[] | null; error: ComsApiError | null }> {
  if (COMS_CONFIG.mockMode) {
    await mockDelay();
    return { data: mockStore.listThreads(filters), error: null };
  }
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([k, v]) => {
    if (v != null && v !== '') params.set(k, String(v));
  });
  return apiFetch<ComsThread[]>(`/threads?${params}`);
}

export async function getThread(
  threadId: string,
): Promise<{ data: ComsThread | null; error: ComsApiError | null }> {
  if (COMS_CONFIG.mockMode) {
    await mockDelay();
    const thread = mockStore.getThread(threadId);
    return thread
      ? { data: thread, error: null }
      : { data: null, error: { message: 'Thread not found', code: '404' } };
  }
  return apiFetch<ComsThread>(`/thread/${threadId}`);
}

export async function createMessage(payload: {
  suiteKey: string;
  channel: string;
  to: string;
  subject: string;
  body: string;
  priority?: string;
  isInternal?: boolean;
}): Promise<{ data: ComsThread | null; error: ComsApiError | null }> {
  if (COMS_CONFIG.mockMode) {
    await mockDelay();
    const threadId = 't-' + Math.random().toString(36).slice(2, 8);
    const now = new Date().toISOString();
    const newMsg: ComsMessage = {
      id: 'm-' + Math.random().toString(36).slice(2, 8),
      tenantId: 'amineva',
      suiteKey: payload.suiteKey,
      threadId,
      channel: payload.channel as ComsMessage['channel'],
      direction: payload.isInternal ? 'internal' : 'outbound',
      from: 'support@amineva.com',
      to: payload.to,
      subject: payload.subject,
      body: payload.body,
      status: 'queued',
      priority: (payload.priority as ComsMessage['priority']) || 'medium',
      createdAt: now,
      updatedAt: now,
    };
    const newThread: ComsThread = {
      threadId,
      suiteKey: payload.suiteKey,
      tenantId: 'amineva',
      title: payload.subject,
      status: 'open',
      priority: (payload.priority as ComsThread['priority']) || 'medium',
      lastMessageAt: now,
      participants: ['support@amineva.com', payload.to],
      messages: [newMsg],
    };
    mockStore.createThread(newThread);

    // simulate queued->sent after short delay
    setTimeout(() => {
      newMsg.status = 'sent';
      newMsg.updatedAt = new Date().toISOString();
    }, 2000);

    return { data: newThread, error: null };
  }
  return apiFetch<ComsThread>('/message/create', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function sendEmail(payload: {
  to: string;
  subject: string;
  body: string;
  suiteKey: string;
}): Promise<{ data: { status: string } | null; error: ComsApiError | null }> {
  if (COMS_CONFIG.mockMode) {
    await mockDelay();
    // Reuse createMessage for mock
    await createMessage({ ...payload, channel: 'email' });
    return { data: { status: 'queued' }, error: null };
  }
  return apiFetch<{ status: string }>('/email/send', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function listLogs(
  filters: ComsListFilters = {},
): Promise<{ data: ComsLogEntry[] | null; error: ComsApiError | null }> {
  if (COMS_CONFIG.mockMode) {
    await mockDelay();
    return { data: mockStore.listLogs(filters), error: null };
  }
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([k, v]) => {
    if (v != null && v !== '') params.set(k, String(v));
  });
  return apiFetch<ComsLogEntry[]>(`/logs?${params}`);
}

export async function listTemplates(
  filters: ComsListFilters = {},
): Promise<{ data: ComsTemplate[] | null; error: ComsApiError | null }> {
  if (COMS_CONFIG.mockMode) {
    await mockDelay();
    return { data: mockStore.listTemplates(), error: null };
  }
  return apiFetch<ComsTemplate[]>('/templates');
}

export async function listCampaigns(
  filters: ComsListFilters = {},
): Promise<{ data: ComsCampaign[] | null; error: ComsApiError | null }> {
  if (COMS_CONFIG.mockMode) {
    await mockDelay();
    return { data: mockStore.listCampaigns(), error: null };
  }
  return apiFetch<ComsCampaign[]>('/campaigns');
}

export function getKpiStats(): ComsKpiStats {
  return mockStore.computeKpi();
}
