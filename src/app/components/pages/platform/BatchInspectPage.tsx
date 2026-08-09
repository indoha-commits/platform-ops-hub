import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, ExternalLink } from 'lucide-react';
import { getMonitorBatch, type MonitorBatchResponse } from '@/app/api/monitoring';
import { Card, StatusBadge, timeAgo, formatDate, Loading, ErrorText } from './monitor/ui';

export default function BatchInspectPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [data, setData] = useState<MonitorBatchResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    const fetch = async () => {
      try {
        const res = await getMonitorBatch(id);
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
    return () => { cancelled = true; };
  }, [id]);

  if (loading) return <Loading />;
  if (error && !data) return <ErrorText>{error}</ErrorText>;
  if (!data) return <ErrorText>No data</ErrorText>;

  const members = data.members ?? [];
  const verdict = data.coordinator_artifact?.verdict;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate('/monitoring/documents')} className="inline-flex items-center gap-1.5 text-sm font-semibold px-3 py-1.5 rounded-lg border" style={{ borderColor: 'var(--border)' }}>
          <ArrowLeft className="w-4 h-4" />Back
        </button>
        <div>
          <h1 className="text-xl font-bold tracking-tight">Batch {data.batch_id.slice(0, 12)}</h1>
          <p className="text-muted-foreground text-xs mt-0.5">{data.found ? `${members.length} member document(s)` : 'Batch not found (no matching artifacts)'}</p>
        </div>
      </div>

      {data.found && verdict && (
        <Card title="Bundle verdict" subtitle={`Anchor: ${verdict.anchor_bl || '—'} · outcome: ${verdict.outcome || verdict.action || '—'}`}>
          <pre className="rounded-md p-3 overflow-x-auto text-[11px] leading-relaxed" style={{ backgroundColor: 'var(--accent)' }}>{JSON.stringify(verdict, null, 2)}</pre>
        </Card>
      )}

      <Card title={`Member documents (${members.length})`}>
        {members.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4 text-center font-medium">No member artifacts found</p>
        ) : (
          <div className="space-y-2">
            {members.map((m) => (
              <div key={m.artifact_id} className="flex items-center justify-between gap-3 rounded-md px-3 py-2 text-sm" style={{ backgroundColor: 'var(--accent)' }}>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <StatusBadge value={m.status} />
                    <span className="font-medium truncate">{m.document_id.slice(0, 12)}</span>
                  </div>
                  {m.payload?.fields && (
                    <div className="text-xs text-muted-foreground mt-0.5 truncate">
                      BL: {m.payload.fields.bl_number || '—'} · containers: {(m.payload.fields.container_numbers ?? []).join(', ') || '—'}
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-xs text-muted-foreground tabular-nums">{timeAgo(m.created_at)}</span>
                  <button onClick={() => navigate(`/monitoring/document/${m.document_id}`)}
                    className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded border" style={{ borderColor: 'var(--border)' }}>
                    <ExternalLink className="w-3.5 h-3.5" />Inspect
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {data.recent_runs.length > 0 && (
        <Card title="Recent OCR-sim runs (24h)">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wide text-muted-foreground border-b" style={{ borderColor: 'var(--border)' }}>
                  <th className="py-2 pr-3 font-semibold">Status</th>
                  <th className="py-2 pr-3 font-semibold">Document</th>
                  <th className="py-2 pr-3 font-semibold">Trigger</th>
                  <th className="py-2 pr-3 font-semibold">Created</th>
                  <th className="py-2 font-semibold">Error</th>
                </tr>
              </thead>
              <tbody>
                {data.recent_runs.map((r) => (
                  <tr key={r.id} className="border-b last:border-0" style={{ borderColor: 'var(--border)' }}>
                    <td className="py-2 pr-3"><StatusBadge value={r.status} /></td>
                    <td className="py-2 pr-3 font-mono text-xs">{r.document_id.slice(0, 12)}</td>
                    <td className="py-2 pr-3 text-xs text-muted-foreground">{r.trigger_source || '—'}</td>
                    <td className="py-2 pr-3 text-xs text-muted-foreground tabular-nums">{formatDate(r.created_at)}</td>
                    <td className="py-2 text-xs text-red-500 max-w-[240px] truncate">{r.error || ''}</td>
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
