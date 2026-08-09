import { fetchJson } from './client';

// ── Monitoring API (superops /superops/admin/monitor/*) ──────────────────────

export type MonitorDbHealth = { ok: boolean; latency_ms: number };

export type MonitorQueueSummary = {
  document_intel_queued: number;
  document_intel_running: number;
  document_intel_stuck: number;
  whatsapp_pending: number;
  whatsapp_stuck: number;
  storage_jobs_queued: number;
  storage_failures_24h: number;
};

export type MonitorSummary = {
  db: MonitorDbHealth;
  storage: MonitorDbHealth;
  errors_24h: number;
  errors_7d: number;
  errors_by_type_24h: Array<{ type: string; severity: string; count: number }>;
  errors_by_type_7d: Array<{ type: string; severity: string; count: number }>;
  queue: MonitorQueueSummary;
  generated_at: string;
};

export type OpsEvent = {
  id: string;
  tenant_id: string | null;
  type: string;
  severity: string;
  category: string | null;
  entity_type: string | null;
  entity_id: string | null;
  status: string | null;
  message: string | null;
  details: any;
  created_at: string;
};

export type MonitorErrorsResponse = {
  events: OpsEvent[];
  window_hours: number;
  count: number;
};

export type StuckAgentRun = {
  id: string;
  tenant_id: string;
  document_id: string;
  status: string;
  error: string | null;
  created_at: string;
  started_at: string | null;
  completed_at: string | null;
  trigger_source: string | null;
};

export type StuckWhatsappPending = {
  id: string;
  provider: string;
  status: string;
  error: string | null;
  received_at: string;
  attempts: number;
};

export type FailedStorageJob = {
  id: string;
  tenant_id: string;
  document_id: string;
  status: string;
  attempts: number;
  last_error: string | null;
  created_at: string;
  updated_at: string;
};

export type MonitorQueueResponse = {
  stuck_agent_runs: StuckAgentRun[];
  stuck_whatsapp_pending: StuckWhatsappPending[];
  failed_storage_jobs: FailedStorageJob[];
  thresholds: { running_minutes: number; queued_minutes: number };
};

export type RunRow = {
  run_id: string;
  tenant_id: string;
  tenant: string | null;
  document_id: string;
  status: string;
  error: string | null;
  trigger_source: string | null;
  created_at: string;
  started_at: string | null;
  completed_at: string | null;
  latency_ms: number | null;
};

export type MonitorDocumentsResponse = {
  runs: RunRow[];
  count: number;
};

export type DocumentHistoryResponse = {
  document: {
    id: string;
    tenant_id: string;
    cargo_id: string | null;
    document_type: string | null;
    source_storage_path: string | null;
    provider_path: string | null;
    status: string | null;
    created_at: string;
    metadata: any;
  };
  runs: Array<{
    run_id: string;
    status: string;
    error: string | null;
    trigger_source: string | null;
    created_at: string;
    started_at: string | null;
    completed_at: string | null;
    latency_ms: number | null;
    events: OpsEvent[];
  }>;
  intake_events: Array<{
    id: string;
    created_at: string;
    from_number: string;
    status: string;
    filename: string | null;
    matched_cargo_id: string | null;
    document_id: string | null;
  }>;
};

export type MonitorBatchResponse = {
  batch_id: string;
  found: boolean;
  coordinator_artifact: any;
  members: Array<{
    artifact_id: string;
    run_id: string;
    document_id: string;
    status: string;
    created_at: string;
    payload: any;
  }>;
  recent_runs: StuckAgentRun[];
};

export type WebhookReceipt = {
  id: string;
  provider: string;
  path: string | null;
  payload: any;
  signature_valid: boolean;
  status: string;
  attempts: number;
  last_error: string | null;
  tenant_id: string | null;
  processed_at: string | null;
  created_at: string;
};

export type MonitorWebhooksResponse = {
  receipts: WebhookReceipt[];
  count: number;
};

export type UsageSpike = {
  tenant_id: string;
  tenant_name: string;
  today_count: number;
  avg_prev: number;
  ratio: number;
  daily: Record<string, number>;
};

export type MonitorUsageResponse = {
  window_days: number;
  today: string;
  total_documents: number;
  total_cargo: number;
  spikes: UsageSpike[];
};

export type MonitorVpsResponse = {
  configured: boolean;
  ok?: boolean;
  note?: string;
  body?: any;
  error?: string;
};

export type MonitorErrorsParams = {
  type?: string;
  severity?: string;
  tenant?: string;
  category?: string;
  window?: number;
  limit?: number;
};

export function getMonitorSummary(): Promise<MonitorSummary> {
  return fetchJson('/superops/admin/monitor/summary', { method: 'GET' });
}

export function getMonitorErrors(params: MonitorErrorsParams = {}): Promise<MonitorErrorsResponse> {
  const qs = new URLSearchParams();
  if (params.type) qs.set('type', params.type);
  if (params.severity) qs.set('severity', params.severity);
  if (params.tenant) qs.set('tenant', params.tenant);
  if (params.category) qs.set('category', params.category);
  if (params.window) qs.set('window', String(params.window));
  if (params.limit) qs.set('limit', String(params.limit));
  const q = qs.toString();
  return fetchJson(`/superops/admin/monitor/errors${q ? `?${q}` : ''}`, { method: 'GET' });
}

export function getMonitorQueue(): Promise<MonitorQueueResponse> {
  return fetchJson('/superops/admin/monitor/queue', { method: 'GET' });
}

export function getMonitorDocuments(params: { status?: string; tenant?: string; limit?: number } = {}): Promise<MonitorDocumentsResponse> {
  const qs = new URLSearchParams();
  if (params.status) qs.set('status', params.status);
  if (params.tenant) qs.set('tenant', params.tenant);
  if (params.limit) qs.set('limit', String(params.limit));
  const q = qs.toString();
  return fetchJson(`/superops/admin/monitor/documents${q ? `?${q}` : ''}`, { method: 'GET' });
}

export function getMonitorDocumentHistory(documentId: string): Promise<DocumentHistoryResponse> {
  return fetchJson(`/superops/admin/monitor/documents/${encodeURIComponent(documentId)}/history`, { method: 'GET' });
}

export function postMonitorDocumentRetry(documentId: string): Promise<{ ok: boolean; run_id: string; action: string }> {
  return fetchJson(`/superops/admin/monitor/documents/${encodeURIComponent(documentId)}/retry`, { method: 'POST' });
}

export function postMonitorDocumentRerunOcr(documentId: string): Promise<{ ok: boolean; run_id: string; note?: string }> {
  return fetchJson(`/superops/admin/monitor/documents/${encodeURIComponent(documentId)}/rerun-ocr`, { method: 'POST' });
}

export function getMonitorBatch(batchId: string): Promise<MonitorBatchResponse> {
  return fetchJson(`/superops/admin/monitor/batches/${encodeURIComponent(batchId)}`, { method: 'GET' });
}

export function getMonitorWebhooks(params: { status?: string; provider?: string; limit?: number } = {}): Promise<MonitorWebhooksResponse> {
  const qs = new URLSearchParams();
  if (params.status) qs.set('status', params.status);
  if (params.provider) qs.set('provider', params.provider);
  if (params.limit) qs.set('limit', String(params.limit));
  const q = qs.toString();
  return fetchJson(`/superops/admin/monitor/webhooks${q ? `?${q}` : ''}`, { method: 'GET' });
}

export function postMonitorWebhookReplay(receiptId: string): Promise<{ ok: boolean; processed: number; reason: string | null }> {
  return fetchJson(`/superops/admin/monitor/webhooks/${encodeURIComponent(receiptId)}/replay`, { method: 'POST' });
}

export function postMonitorStorageJobRetry(jobId: string): Promise<{ ok: boolean }> {
  return fetchJson(`/superops/admin/monitor/storage-jobs/${encodeURIComponent(jobId)}/retry`, { method: 'POST' });
}

export function getMonitorUsage(params: { window?: number } = {}): Promise<MonitorUsageResponse> {
  const qs = new URLSearchParams();
  if (params.window) qs.set('window', String(params.window));
  const q = qs.toString();
  return fetchJson(`/superops/admin/monitor/usage${q ? `?${q}` : ''}`, { method: 'GET' });
}

export function getMonitorVps(): Promise<MonitorVpsResponse> {
  return fetchJson('/superops/admin/monitor/vps', { method: 'GET' });
}
