/**
 * Lightweight in-memory mock store for ComsSystem.
 * Seeds realistic data so UI works end-to-end before backend is ready.
 */
import type {
  ComsThread,
  ComsMessage,
  ComsLogEntry,
  ComsTemplate,
  ComsCampaign,
  ComsKpiStats,
  ComsListFilters,
  ComsHealthResponse,
  ComsChannel,
  ComsDirection,
  ComsPriority,
  ComsMessageStatus,
  ComsThreadStatus,
} from './types';

// ── helpers ──────────────────────────────────────────────

function id(): string {
  return Math.random().toString(36).slice(2, 10);
}

function hoursAgo(h: number): string {
  return new Date(Date.now() - h * 3600_000).toISOString();
}

function daysAgo(d: number): string {
  return new Date(Date.now() - d * 86_400_000).toISOString();
}

const today = new Date().toISOString().split('T')[0];

// ── seed messages helper ─────────────────────────────────

function msg(
  threadId: string,
  suiteKey: string,
  overrides: Partial<ComsMessage> = {},
): ComsMessage {
  return {
    id: id(),
    tenantId: 'amineva',
    suiteKey,
    threadId,
    channel: 'email',
    direction: 'inbound',
    from: 'user@example.com',
    to: 'support@amineva.com',
    subject: 'Subject',
    body: 'Body',
    status: 'read',
    createdAt: hoursAgo(2),
    updatedAt: hoursAgo(2),
    ...overrides,
  };
}

// ── seed threads ─────────────────────────────────────────

function buildSeedThreads(): ComsThread[] {
  const threads: ComsThread[] = [
    {
      threadId: 't1',
      suiteKey: 'agstock',
      tenantId: 'amineva',
      title: 'Stock discrepancy on SKU-4921',
      status: 'open',
      priority: 'high',
      lastMessageAt: hoursAgo(1),
      participants: ['warehouse@amineva.com', 'support@amineva.com'],
      messages: [
        msg('t1', 'agstock', {
          from: 'warehouse@amineva.com',
          subject: 'Stock discrepancy on SKU-4921',
          body: 'Hi team,\n\nWe have a discrepancy of 14 units on SKU-4921 between the physical count and AGStock records. Can someone look into this?\n\nThanks,\nWarehouse Team',
          status: 'unread',
          direction: 'inbound',
          channel: 'ticket',
          priority: 'high',
          createdAt: hoursAgo(3),
          updatedAt: hoursAgo(3),
        }),
        msg('t1', 'agstock', {
          from: 'support@amineva.com',
          to: 'warehouse@amineva.com',
          subject: 'Re: Stock discrepancy on SKU-4921',
          body: 'Hi,\n\nWe have started investigating. It looks like there was a bulk import that may have duplicated entries. We will update you shortly.',
          status: 'sent',
          direction: 'outbound',
          channel: 'ticket',
          createdAt: hoursAgo(2),
          updatedAt: hoursAgo(2),
        }),
      ],
    },
    {
      threadId: 't2',
      suiteKey: 'phoxtra',
      tenantId: 'amineva',
      title: 'New user onboarding email not received',
      status: 'pending_reply',
      priority: 'medium',
      lastMessageAt: hoursAgo(4),
      participants: ['jane.doe@client.com', 'support@amineva.com'],
      messages: [
        msg('t2', 'phoxtra', {
          from: 'jane.doe@client.com',
          subject: 'New user onboarding email not received',
          body: 'Hello,\n\nI signed up two hours ago but have not received any welcome email. I checked spam as well. Could you please resend?\n\nJane',
          status: 'read',
          direction: 'inbound',
          channel: 'email',
          priority: 'medium',
          createdAt: hoursAgo(4),
          updatedAt: hoursAgo(4),
        }),
      ],
    },
    {
      threadId: 't3',
      suiteKey: 'amineva-console',
      tenantId: 'amineva',
      title: 'System maintenance notification – Feb 10',
      status: 'resolved',
      priority: 'low',
      lastMessageAt: daysAgo(1),
      participants: ['ops@amineva.com'],
      messages: [
        msg('t3', 'amineva-console', {
          from: 'ops@amineva.com',
          subject: 'System maintenance notification – Feb 10',
          body: 'Scheduled maintenance will occur on Feb 10 from 02:00–04:00 UTC. All Amineva services may experience brief downtime.',
          status: 'delivered',
          direction: 'outbound',
          channel: 'notification',
          createdAt: daysAgo(1),
          updatedAt: daysAgo(1),
        }),
      ],
    },
    {
      threadId: 't4',
      suiteKey: 'agstock',
      tenantId: 'amineva',
      title: 'Low stock alert: Product Batch #221',
      status: 'open',
      priority: 'high',
      lastMessageAt: hoursAgo(0.5),
      participants: ['alerts@agstock.amineva.com', 'manager@amineva.com'],
      messages: [
        msg('t4', 'agstock', {
          from: 'alerts@agstock.amineva.com',
          subject: 'Low stock alert: Product Batch #221',
          body: 'Product Batch #221 has fallen below the minimum threshold.\n\nCurrent stock: 3 units\nMinimum threshold: 10 units\n\nPlease reorder immediately.',
          status: 'unread',
          direction: 'internal',
          channel: 'notification',
          priority: 'high',
          createdAt: hoursAgo(0.5),
          updatedAt: hoursAgo(0.5),
        }),
      ],
    },
    {
      threadId: 't5',
      suiteKey: 'aghub',
      tenantId: 'amineva',
      title: 'Invoice #INV-2025-0089 sent',
      status: 'closed',
      priority: 'low',
      lastMessageAt: daysAgo(2),
      participants: ['billing@amineva.com', 'client-a@company.com'],
      messages: [
        msg('t5', 'aghub', {
          from: 'billing@amineva.com',
          to: 'client-a@company.com',
          subject: 'Invoice #INV-2025-0089 sent',
          body: 'Dear Client,\n\nYour invoice #INV-2025-0089 for GHS 4,500.00 has been generated and sent.\n\nDue date: Feb 28, 2025\n\nRegards,\nAmineva Billing',
          status: 'delivered',
          direction: 'outbound',
          channel: 'email',
          createdAt: daysAgo(2),
          updatedAt: daysAgo(2),
        }),
      ],
    },
    {
      threadId: 't6',
      suiteKey: 'phoxtra',
      tenantId: 'amineva',
      title: 'Feature request: Bulk export to CSV',
      status: 'open',
      priority: 'medium',
      lastMessageAt: hoursAgo(6),
      participants: ['kwame@partner.co', 'support@amineva.com'],
      messages: [
        msg('t6', 'phoxtra', {
          from: 'kwame@partner.co',
          subject: 'Feature request: Bulk export to CSV',
          body: 'Hi Amineva,\n\nIt would be great if Phoxtra supported bulk exporting user records to CSV. Currently I have to do it one page at a time.\n\nThanks,\nKwame',
          status: 'unread',
          direction: 'inbound',
          channel: 'ticket',
          priority: 'medium',
          createdAt: hoursAgo(6),
          updatedAt: hoursAgo(6),
        }),
      ],
    },
    {
      threadId: 't7',
      suiteKey: 'agis',
      tenantId: 'amineva',
      title: 'Access request for admin dashboard',
      status: 'pending_reply',
      priority: 'high',
      lastMessageAt: hoursAgo(3),
      participants: ['newadmin@amineva.com', 'security@amineva.com'],
      messages: [
        msg('t7', 'agis', {
          from: 'newadmin@amineva.com',
          subject: 'Access request for admin dashboard',
          body: 'Hello Security Team,\n\nI need admin access to the AGIS dashboard for auditing purposes. My manager approved this via ticket #SEC-442.\n\nRegards,\nNew Admin',
          status: 'read',
          direction: 'inbound',
          channel: 'ticket',
          priority: 'high',
          createdAt: hoursAgo(5),
          updatedAt: hoursAgo(3),
        }),
        msg('t7', 'agis', {
          from: 'security@amineva.com',
          to: 'newadmin@amineva.com',
          subject: 'Re: Access request for admin dashboard',
          body: 'Hi,\n\nWe received your request and are verifying with your manager. Please allow 24 hours for processing.\n\nSecurity Team',
          status: 'sent',
          direction: 'outbound',
          channel: 'ticket',
          createdAt: hoursAgo(3),
          updatedAt: hoursAgo(3),
        }),
      ],
    },
    {
      threadId: 't8',
      suiteKey: 'amineva-console',
      tenantId: 'amineva',
      title: 'Welcome to Amineva Suite!',
      status: 'closed',
      priority: 'low',
      lastMessageAt: daysAgo(5),
      participants: ['onboarding@amineva.com'],
      messages: [
        msg('t8', 'amineva-console', {
          from: 'onboarding@amineva.com',
          subject: 'Welcome to Amineva Suite!',
          body: 'Welcome aboard! Your Amineva Suite account is ready. Explore the dashboard, set up your profile, and start managing your products.',
          status: 'read',
          direction: 'outbound',
          channel: 'email',
          createdAt: daysAgo(5),
          updatedAt: daysAgo(5),
        }),
      ],
    },
    {
      threadId: 't9',
      suiteKey: 'agstock',
      tenantId: 'amineva',
      title: 'Daily sales summary – Feb 8',
      status: 'resolved',
      priority: 'low',
      lastMessageAt: daysAgo(1),
      participants: ['reports@agstock.amineva.com'],
      messages: [
        msg('t9', 'agstock', {
          from: 'reports@agstock.amineva.com',
          subject: 'Daily sales summary – Feb 8',
          body: 'Sales Summary for Feb 8, 2025:\n\n• Total sales: GHS 12,340.00\n• Items sold: 87\n• Top product: Batch #115 (23 units)\n\nFull report attached.',
          status: 'delivered',
          direction: 'outbound',
          channel: 'notification',
          createdAt: daysAgo(1),
          updatedAt: daysAgo(1),
        }),
      ],
    },
    {
      threadId: 't10',
      suiteKey: 'aghub',
      tenantId: 'amineva',
      title: 'Partnership inquiry from TechGlobal',
      status: 'open',
      priority: 'medium',
      lastMessageAt: hoursAgo(8),
      participants: ['partnerships@techglobal.io', 'biz@amineva.com'],
      messages: [
        msg('t10', 'aghub', {
          from: 'partnerships@techglobal.io',
          subject: 'Partnership inquiry from TechGlobal',
          body: 'Dear Amineva Team,\n\nWe are interested in exploring a partnership for distribution in West Africa. Would it be possible to schedule a call this week?\n\nBest,\nTechGlobal Partnerships',
          status: 'unread',
          direction: 'inbound',
          channel: 'email',
          priority: 'medium',
          createdAt: hoursAgo(8),
          updatedAt: hoursAgo(8),
        }),
      ],
    },
  ];
  return threads;
}

// ── seed logs ─────────────────────────────────────────────

function buildSeedLogs(): ComsLogEntry[] {
  return [
    { id: id(), timestamp: hoursAgo(0.5), event: 'delivered', channel: 'email', recipient: 'client-a@company.com', subject: 'Invoice #INV-2025-0089', suiteKey: 'aghub', messageType: 'transactional' },
    { id: id(), timestamp: hoursAgo(1), event: 'opened', channel: 'email', recipient: 'jane.doe@client.com', subject: 'Welcome to Phoxtra', suiteKey: 'phoxtra', messageType: 'transactional' },
    { id: id(), timestamp: hoursAgo(1.5), event: 'queued', channel: 'notification', recipient: 'manager@amineva.com', subject: 'Low stock alert', suiteKey: 'agstock', messageType: 'system' },
    { id: id(), timestamp: hoursAgo(2), event: 'delivered', channel: 'email', recipient: 'warehouse@amineva.com', subject: 'Re: Stock discrepancy', suiteKey: 'agstock', messageType: 'support' },
    { id: id(), timestamp: hoursAgo(3), event: 'failed', channel: 'email', recipient: 'bounced@invalid.com', subject: 'February Newsletter', suiteKey: 'amineva-console', messageType: 'marketing', details: 'Mailbox not found' },
    { id: id(), timestamp: hoursAgo(4), event: 'delivered', channel: 'notification', recipient: 'ops@amineva.com', subject: 'Maintenance reminder', suiteKey: 'amineva-console', messageType: 'system' },
    { id: id(), timestamp: hoursAgo(5), event: 'clicked', channel: 'email', recipient: 'kwame@partner.co', subject: 'Product update', suiteKey: 'phoxtra', messageType: 'marketing' },
    { id: id(), timestamp: hoursAgo(6), event: 'bounced', channel: 'email', recipient: 'old@expired.net', subject: 'Newsletter #42', suiteKey: 'amineva-console', messageType: 'marketing', details: 'Domain expired' },
    { id: id(), timestamp: hoursAgo(8), event: 'delivered', channel: 'email', recipient: 'partnerships@techglobal.io', subject: 'Partnership follow-up', suiteKey: 'aghub', messageType: 'support' },
    { id: id(), timestamp: daysAgo(1), event: 'delivered', channel: 'email', recipient: 'newadmin@amineva.com', subject: 'Access granted', suiteKey: 'agis', messageType: 'transactional' },
  ];
}

// ── seed templates ────────────────────────────────────────

function buildSeedTemplates(): ComsTemplate[] {
  return [
    { id: 'tpl-1', name: 'Welcome Email', type: 'transactional', category: 'onboarding', description: 'Sent to new users after registration', subject: 'Welcome to {{product}}, {{name}}!', body: 'Hello {{name}},\n\nWelcome to {{product}}! We are excited to have you on board.\n\nBest regards,\nAmineva Team', variables: ['{{name}}', '{{email}}', '{{product}}'], lastUpdated: daysAgo(3).split('T')[0], usageCount: 1245 },
    { id: 'tpl-2', name: 'Password Reset', type: 'transactional', category: 'security', description: 'Password reset link with OTP', subject: 'Password Reset Request', body: 'Hello {{name}},\n\nUse the following OTP: {{otp}}\n\nThis expires in 15 minutes.', variables: ['{{name}}', '{{otp}}', '{{link}}'], lastUpdated: daysAgo(5).split('T')[0], usageCount: 532 },
    { id: 'tpl-3', name: 'Invoice Notification', type: 'transactional', category: 'billing', description: 'Invoice ready notification', subject: 'Invoice #{{invoice_number}} Ready', body: 'Dear {{name}},\n\nYour invoice #{{invoice_number}} for {{amount}} is ready.\n\nDue date: {{due_date}}', variables: ['{{name}}', '{{invoice_number}}', '{{amount}}', '{{due_date}}'], lastUpdated: daysAgo(10).split('T')[0], usageCount: 2103 },
    { id: 'tpl-4', name: 'Low Stock Alert', type: 'notification', category: 'system', description: 'Alert when product inventory falls below threshold', subject: 'Low Stock Alert: {{product_name}}', body: 'Product: {{product_name}}\nSKU: {{sku}}\nCurrent Stock: {{current_stock}}\nThreshold: {{threshold}}', variables: ['{{product_name}}', '{{sku}}', '{{current_stock}}', '{{threshold}}'], lastUpdated: daysAgo(7).split('T')[0], usageCount: 456 },
    { id: 'tpl-5', name: 'Monthly Newsletter', type: 'marketing', category: 'newsletter', description: 'Monthly update with news and promotions', subject: '{{month}} Newsletter from Amineva', body: 'Hello {{name}},\n\nHere is your {{month}} newsletter!\n\n{{featured_products}}', variables: ['{{name}}', '{{month}}', '{{featured_products}}'], lastUpdated: daysAgo(14).split('T')[0], usageCount: 12 },
  ];
}

// ── seed campaigns ────────────────────────────────────────

function buildSeedCampaigns(): ComsCampaign[] {
  return [
    { id: 'cmp-1', name: 'February Promo Launch', status: 'active', type: 'marketing', audience: 2340, sent: 2340, delivered: 2298, opened: 982, clicked: 234, scheduledAt: null, createdAt: daysAgo(10).split('T')[0] },
    { id: 'cmp-2', name: 'New Product Announcement', status: 'scheduled', type: 'marketing', audience: 5120, sent: 0, delivered: 0, opened: 0, clicked: 0, scheduledAt: '2025-02-15 09:00', createdAt: daysAgo(5).split('T')[0] },
    { id: 'cmp-3', name: 'Weekly Newsletter #42', status: 'completed', type: 'newsletter', audience: 8450, sent: 8450, delivered: 8321, opened: 4102, clicked: 892, scheduledAt: null, createdAt: daysAgo(14).split('T')[0] },
    { id: 'cmp-4', name: 'Customer Survey Q1', status: 'draft', type: 'transactional', audience: 1200, sent: 0, delivered: 0, opened: 0, clicked: 0, scheduledAt: null, createdAt: daysAgo(3).split('T')[0] },
  ];
}

// ── MockStore class ──────────────────────────────────────

class MockStore {
  threads: ComsThread[];
  logs: ComsLogEntry[];
  templates: ComsTemplate[];
  campaigns: ComsCampaign[];

  constructor() {
    this.threads = buildSeedThreads();
    this.logs = buildSeedLogs();
    this.templates = buildSeedTemplates();
    this.campaigns = buildSeedCampaigns();
  }

  // ── threads ──

  listThreads(filters: ComsListFilters = {}): ComsThread[] {
    let result = [...this.threads];

    if (filters.suiteKey) {
      result = result.filter((t) => t.suiteKey === filters.suiteKey);
    }
    if (filters.channel) {
      result = result.filter((t) =>
        t.messages.some((m) => m.channel === filters.channel),
      );
    }
    if (filters.status) {
      result = result.filter((t) => t.status === filters.status);
    }
    if (filters.search) {
      const q = filters.search.toLowerCase();
      result = result.filter(
        (t) =>
          t.title.toLowerCase().includes(q) ||
          t.participants.some((p) => p.toLowerCase().includes(q)) ||
          t.messages.some(
            (m) =>
              m.subject.toLowerCase().includes(q) ||
              m.body.toLowerCase().includes(q),
          ),
      );
    }

    // sort newest first
    result.sort(
      (a, b) =>
        new Date(b.lastMessageAt).getTime() -
        new Date(a.lastMessageAt).getTime(),
    );

    return result;
  }

  getThread(threadId: string): ComsThread | undefined {
    return this.threads.find((t) => t.threadId === threadId);
  }

  addMessageToThread(threadId: string, message: ComsMessage): void {
    const thread = this.threads.find((t) => t.threadId === threadId);
    if (thread) {
      thread.messages.push(message);
      thread.lastMessageAt = message.createdAt;
    }
  }

  createThread(thread: ComsThread): void {
    this.threads.unshift(thread);
  }

  // ── KPI ──

  computeKpi(): ComsKpiStats {
    const allMessages = this.threads.flatMap((t) => t.messages);

    const unread = allMessages.filter((m) => m.status === 'unread').length;
    const pendingReplies = this.threads.filter(
      (t) => t.status === 'pending_reply' || t.status === 'open',
    ).length;

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const sentToday = allMessages.filter(
      (m) =>
        m.direction === 'outbound' &&
        new Date(m.createdAt).getTime() >= todayStart.getTime(),
    ).length;

    const last24h = Date.now() - 86_400_000;
    const recentSent = allMessages.filter(
      (m) =>
        m.direction === 'outbound' &&
        new Date(m.createdAt).getTime() >= last24h,
    );
    const recentDelivered = recentSent.filter(
      (m) => m.status === 'delivered' || m.status === 'read' || m.status === 'sent',
    );
    const deliveryRate =
      recentSent.length > 0
        ? Math.round((recentDelivered.length / recentSent.length) * 100)
        : 98; // default mock

    return { unread, pendingReplies, sentToday, deliveryRate };
  }

  // ── logs ──

  listLogs(filters: ComsListFilters = {}): ComsLogEntry[] {
    let result = [...this.logs];
    if (filters.suiteKey) result = result.filter((l) => l.suiteKey === filters.suiteKey);
    if (filters.status) result = result.filter((l) => l.event === filters.status);
    if (filters.channel) result = result.filter((l) => l.channel === filters.channel);
    if (filters.search) {
      const q = filters.search.toLowerCase();
      result = result.filter(
        (l) =>
          l.recipient.toLowerCase().includes(q) ||
          l.subject.toLowerCase().includes(q) ||
          l.suiteKey.toLowerCase().includes(q),
      );
    }
    result.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    return result;
  }

  // ── templates ──

  listTemplates(): ComsTemplate[] {
    return [...this.templates];
  }

  // ── campaigns ──

  listCampaigns(): ComsCampaign[] {
    return [...this.campaigns];
  }

  // ── health ──

  healthCheck(): ComsHealthResponse {
    return { ok: true, timestamp: new Date().toISOString(), version: 'mock-1.0.0' };
  }
}

/** Singleton mock store instance */
export const mockStore = new MockStore();
