import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ExternalLink } from 'lucide-react';
import { getMonitorErrors, type OpsEvent, type MonitorErrorsResponse } from '@/app/api/monitoring';
import { Card, SeverityBadge, StatusBadge, timeAgo, formatDate, Loading, ErrorText } from './monitor/ui';

const TYPE_LABEL: Record<string, string> = {
  api_error: 'API error',
  queue_retry: 'Queue retry',
  ocr_failure: 'OCR failure',
  doc_intel_stage: 'Doc intel',
  whatsapp_send_failure: 'WhatsApp send',
  webhook_failure: 'Webhook failure',
  auth_failure: 'Auth failure',
  billing_failure: 'Billing failure',
  storage_job_failure: 'Storage job failure',
  vps_unreachable: 'VPS unreachable',
  manual_action: 'Manual action',
};

export default function ErrorsPage() {
  const navigate = useNavigate();
  const [events, setEvents] = useState<OpsEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [severity, setSeverity] = useState<string>('all');
  const [window, setWindow] = useState<number>(24);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  useEffect(() => {
    let cancelled = false;
    const fetch = async () => {
      try {
        const res: MonitorErrorsResponse = await getMonitorErrors({
          severity: severity === 'all' ? undefined : severity,
          window,
          limit: 100,
        });
        if (cancelled) return;
        setEvents(res.events);
        setError('');
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : String(e));
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    setLoading(true);
    fetch();
    return () => { cancelled = true; };
  }, [severity, window]);

  const toggle = (id: string) => setExpanded((p) => ({ ...p, [id]: !p[id] }));

  const goDoc = (ev: OpsEvent) => {
    const docId = ev.details?.document_id ?? (ev.entity_type === 'document' ? ev.entity_id : null);
    const runId = ev.entity_type === 'agent_run' ? ev.entity_id : null;
    const target = docId ? `/monitoring/document/${docId}` : runId ? `/monitoring/batch/${runId}` : null;
    if (target) navigate(target);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Errors</h1>
        <p className="text-muted-foreground text-sm mt-1">API errors, OCR failures, webhook & send failures</p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {['all', 'error', 'warn'].map((sev) => (
          <button key={sev} onClick={() => setSeverity(sev)}
            className={`px-3.5 py-1.5 rounded-lg text-sm font-semibold transition-colors ${severity === sev ? 'text-white' : 'text-muted-foreground hover:bg-accent/20'}`}
            style={severity === sev ? { backgroundColor: sev === 'error' ? '#ef4444' : sev === 'warn' ? '#f59e0b' : '#5e6ad2' } : {}}>
            {sev === 'all' ? 'All' : sev}
          </button>
        ))}
        <div className="flex-1" />
        <label className="text-xs text-muted-foreground font-semibold mr-1">Window</label>
        <select value={window} onChange={(e) => setWindow(Number(e.target.value))}
          className="rounded-lg border px-2 py-1.5 text-sm" style={{ borderColor: 'var(--border)', backgroundColor: 'var(--background)' }}>
          {[1, 6, 24, 72, 168].map((h) => (
            <option key={h} value={h}>{h === 168 ? '7 days' : h === 72 ? '3 days' : h === 24 ? '24h' : `${h}h`}</option>
          ))}
        </select>
      </div>

      {loading ? <Loading /> : error ? <ErrorText>{error}</ErrorText> : events.length === 0 ? (
        <Card><p className="text-sm text-muted-foreground text-center py-8 font-medium">No events in this window</p></Card>
      ) : (
        <div className="space-y-2">
          {events.map((ev) => {
            const isOpen = expanded[ev.id];
            return (
              <div key={ev.id} className="rounded-lg border p-3.5" style={{ borderColor: 'var(--border)' }}>
                <div className="flex items-start gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <SeverityBadge value={ev.severity} />
                      <span className="text-sm font-semibold">{TYPE_LABEL[ev.type] ?? ev.type}</span>
                      {ev.status && <StatusBadge value={ev.status} />}
                      <span className="text-xs text-muted-foreground tabular-nums">{timeAgo(ev.created_at)}</span>
                    </div>
                    <div className="text-sm mt-1.5 break-words">{ev.message || '—'}</div>
                    <div className="text-xs text-muted-foreground mt-1 font-medium">
                      {ev.category && <span className="uppercase tracking-wide mr-2">{ev.category}</span>}
                      {ev.tenant_id && <span>tenant {ev.tenant_id.slice(0, 8)}</span>}
                      {ev.entity_type && ev.entity_id && <span> · {ev.entity_type} {ev.entity_id.slice(0, 8)}</span>}
                    </div>
                  </div>
                  <div className="flex flex-col gap-1.5 shrink-0">
                    <button onClick={() => goDoc(ev)} disabled={!ev.details?.document_id && ev.entity_type !== 'document' && ev.entity_type !== 'agent_run'}
                      className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-md border disabled:opacity-40"
                      style={{ borderColor: 'var(--border)' }}>
                      <ExternalLink className="w-3.5 h-3.5" /> Inspect
                    </button>
                    <button onClick={() => toggle(ev.id)} className="text-xs font-semibold px-2.5 py-1 rounded-md border" style={{ borderColor: 'var(--border)' }}>
                      {isOpen ? 'Less' : 'Details'}
                    </button>
                  </div>
                </div>
                {isOpen && (
                  <div className="mt-3 pt-3 border-t text-xs space-y-1" style={{ borderColor: 'var(--border)' }}>
                    <div className="text-muted-foreground">At: {formatDate(ev.created_at)}</div>
                    {ev.details && Object.keys(ev.details).length > 0 && (
                      <pre className="rounded-md p-3 overflow-x-auto text-[11px] leading-relaxed" style={{ backgroundColor: 'var(--accent)' }}>{JSON.stringify(ev.details, null, 2)}</pre>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
