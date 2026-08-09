import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Activity, AlertTriangle, Cpu, Database, HardDrive, Layers, RefreshCw, Webhook } from 'lucide-react';
import { getMonitorSummary, getMonitorUsage, type MonitorSummary, type MonitorUsageResponse } from '@/app/api/monitoring';
import { Card, StatusBadge, Loading } from './monitor/ui';

const TYPE_LABEL: Record<string, string> = {
  api_error: 'API errors',
  queue_retry: 'Queue retries',
  ocr_failure: 'OCR failures',
  doc_intel_stage: 'Doc intel',
  whatsapp_send_failure: 'WhatsApp send',
  webhook_failure: 'Webhook failures',
  auth_failure: 'Auth failures',
  billing_failure: 'Billing failures',
  storage_job_failure: 'Storage jobs',
  vps_unreachable: 'VPS unreachable',
  manual_action: 'Manual actions',
};

function HealthPill({ ok, latency }: { ok: boolean; latency?: number }) {
  return (
    <div className="flex items-center gap-2">
      <span className={`w-2.5 h-2.5 rounded-full ${ok ? '' : ''}`} style={{ backgroundColor: ok ? '#22c55e' : '#ef4444' }} />
      <span className="text-xs font-semibold">{ok ? 'Healthy' : 'Unhealthy'}</span>
      {typeof latency === 'number' && <span className="text-xs text-muted-foreground tabular-nums">{latency}ms</span>}
    </div>
  );
}

function MetricCard({ label, value, tone = '#5e6ad2', sub }: { label: string; value: string | number; tone?: string; sub?: string }) {
  return (
    <div className="rounded-lg border p-4" style={{ borderColor: 'var(--border)' }}>
      <div className="text-xs font-semibold uppercase tracking-wide" style={{ color: tone }}>{label}</div>
      <div className="text-2xl font-bold tabular-nums mt-1">{value}</div>
      {sub && <div className="text-xs text-muted-foreground mt-0.5">{sub}</div>}
    </div>
  );
}

export default function MonitorOverviewPage() {
  const navigate = useNavigate();
  const [summary, setSummary] = useState<MonitorSummary | null>(null);
  const [usage, setUsage] = useState<MonitorUsageResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    const fetchAll = async () => {
      try {
        const [s, u] = await Promise.all([
          getMonitorSummary(),
          getMonitorUsage({ window: 7 }).catch(() => null),
        ]);
        if (cancelled) return;
        setSummary(s);
        setUsage(u);
        setError('');
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : String(e));
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    fetchAll();
    const interval = setInterval(fetchAll, 60000);
    return () => { cancelled = true; clearInterval(interval); };
  }, []);

  if (loading) return <Loading />;
  if (error && !summary) return <div className="space-y-4"><div className="text-lg font-bold">Monitoring</div><div className="text-sm text-red-600">{error}</div></div>;

  const s = summary;
  const spikes = usage?.spikes ?? [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Monitoring</h1>
          <p className="text-muted-foreground text-sm mt-1">Platform health, errors, queues and usage</p>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <RefreshCw className="w-4 h-4" />
          <span>Auto-refresh 60s</span>
        </div>
      </div>

      {s && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <MetricCard label="Errors 24h" value={s.errors_24h} tone="#ef4444" sub={`${s.errors_7d} in 7d`} />
          <MetricCard label="Queue depth" value={s.queue.document_intel_queued + s.queue.whatsapp_pending} tone="#f59e0b" sub="doc-intel + whatsapp" />
          <MetricCard label="Stuck jobs" value={s.queue.document_intel_stuck + s.queue.whatsapp_stuck} tone="#ef4444" sub="running/queued stale" />
          <MetricCard label="Storage failures 24h" value={s.queue.storage_failures_24h} tone="#ef4444" />
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card title="Core health" subtitle="Worker → Supabase / storage probes">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-xs text-muted-foreground mb-1 flex items-center gap-1.5"><Database className="w-3.5 h-3.5" /> Database</div>
              {s && <HealthPill ok={s.db.ok} latency={s.db.latency_ms} />}
            </div>
            <div>
              <div className="text-xs text-muted-foreground mb-1 flex items-center gap-1.5"><HardDrive className="w-3.5 h-3.5" /> Storage</div>
              {s && <HealthPill ok={s.storage.ok} latency={s.storage.latency_ms} />}
            </div>
          </div>
          <div className="flex flex-wrap gap-2 pt-2 border-t mt-2" style={{ borderColor: 'var(--border)' }}>
            <button onClick={() => navigate('/monitoring/queues')} className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg border" style={{ borderColor: 'var(--border)' }}><Layers className="w-3.5 h-3.5" /> Queues & jobs</button>
            <button onClick={() => navigate('/monitoring/webhooks')} className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg border" style={{ borderColor: 'var(--border)' }}><Webhook className="w-3.5 h-3.5" /> Webhooks</button>
            <button onClick={() => navigate('/monitoring/vps')} className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg border" style={{ borderColor: 'var(--border)' }}><Cpu className="w-3.5 h-3.5" /> VPS</button>
          </div>
        </Card>

        <Card title="Errors by type (24h)" subtitle="Counts from the ops event store">
          {s && s.errors_by_type_24h.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center font-medium">No errors in the last 24h</p>
          ) : (
            <div className="space-y-2">
              {(s?.errors_by_type_24h ?? []).slice(0, 8).map((e) => (
                <div key={e.type} className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2"><Activity className="w-3.5 h-3.5 text-muted-foreground" />{TYPE_LABEL[e.type] ?? e.type}</span>
                  <span className="font-semibold tabular-nums" style={{ color: e.severity === 'error' ? '#ef4444' : '#f59e0b' }}>{e.count}</span>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      <Card title="Usage spikes" subtitle="Tenants with today's document+cargo activity ≥3× their 7-day average">
        {spikes.length === 0 ? (
          <p className="text-sm text-muted-foreground py-3 text-center font-medium">No unusual usage detected</p>
        ) : (
          <div className="space-y-2">
            {spikes.map((sp) => (
              <div key={sp.tenant_id} className="flex items-center justify-between text-sm rounded-md px-3 py-2" style={{ backgroundColor: 'var(--accent)' }}>
                <span className="flex items-center gap-2 font-medium"><AlertTriangle className="w-4 h-4 text-amber-500" />{sp.tenant_name}</span>
                <span className="text-xs text-muted-foreground">today <b className="tabular-nums">{sp.today_count}</b> vs avg <b className="tabular-nums">{sp.avg_prev}</b> <StatusBadge value={`${sp.ratio}x`} /></span>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
