import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ExternalLink } from 'lucide-react';
import { getMonitorDocuments, type MonitorDocumentsResponse } from '@/app/api/monitoring';
import { Card, StatusBadge, timeAgo, formatMs, Loading, ErrorText } from './monitor/ui';

const STATUSES = ['all', 'queued', 'running', 'needs_review', 'completed', 'failed'];

export default function DocumentsProcessingPage() {
  const navigate = useNavigate();
  const [data, setData] = useState<MonitorDocumentsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [status, setStatus] = useState('all');

  useEffect(() => {
    let cancelled = false;
    const fetch = async () => {
      setLoading(true);
      try {
        const res = await getMonitorDocuments({ status: status === 'all' ? undefined : status, limit: 100 });
        if (cancelled) return;
        setData(res);
        setError('');
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : String(e));
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    fetch();
    const interval = setInterval(fetch, 30000);
    return () => { cancelled = true; clearInterval(interval); };
  }, [status]);

  const runs = data?.runs ?? [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Document Processing</h1>
        <p className="text-muted-foreground text-sm mt-1">Jarvis document-intel runs — status, latency and failures</p>
      </div>

      <div className="flex flex-wrap gap-2">
        {STATUSES.map((s) => (
          <button key={s} onClick={() => setStatus(s)}
            className={`px-3.5 py-1.5 rounded-lg text-sm font-semibold transition-colors ${status === s ? 'text-white' : 'text-muted-foreground hover:bg-accent/20'}`}
            style={status === s ? { backgroundColor: s === 'failed' ? '#ef4444' : s === 'completed' ? '#22c55e' : '#5e6ad2' } : {}}>
            {s.replace('_', ' ')}
          </button>
        ))}
      </div>

      {loading ? <Loading /> : error ? <ErrorText>{error}</ErrorText> : runs.length === 0 ? (
        <Card><p className="text-sm text-muted-foreground text-center py-8 font-medium">No runs match this filter</p></Card>
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wide text-muted-foreground border-b" style={{ borderColor: 'var(--border)' }}>
                  <th className="py-2 pr-3 font-semibold">Status</th>
                  <th className="py-2 pr-3 font-semibold">Tenant</th>
                  <th className="py-2 pr-3 font-semibold">Trigger</th>
                  <th className="py-2 pr-3 font-semibold">Created</th>
                  <th className="py-2 pr-3 font-semibold text-right">Latency</th>
                  <th className="py-2 font-semibold">Error</th>
                  <th className="py-2 font-semibold" />
                </tr>
              </thead>
              <tbody>
                {runs.map((r) => (
                  <tr key={r.run_id} className="border-b last:border-0" style={{ borderColor: 'var(--border)' }}>
                    <td className="py-2.5 pr-3"><StatusBadge value={r.status} /></td>
                    <td className="py-2.5 pr-3 font-medium">{r.tenant ?? r.tenant_id.slice(0, 8)}</td>
                    <td className="py-2.5 pr-3 text-xs text-muted-foreground">{r.trigger_source || '—'}</td>
                    <td className="py-2.5 pr-3 text-xs text-muted-foreground tabular-nums">{timeAgo(r.created_at)}</td>
                    <td className="py-2.5 pr-3 text-right tabular-nums">{formatMs(r.latency_ms)}</td>
                    <td className="py-2.5 pr-3 text-xs text-red-500 max-w-[220px] truncate">{r.error || ''}</td>
                    <td className="py-2.5 text-right">
                      <button onClick={() => navigate(`/monitoring/document/${r.document_id}`)}
                        className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded border" style={{ borderColor: 'var(--border)' }}>
                        <ExternalLink className="w-3.5 h-3.5" />Inspect
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
