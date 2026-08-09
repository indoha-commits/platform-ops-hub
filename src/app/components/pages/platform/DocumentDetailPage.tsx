import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { ArrowLeft, RotateCcw, ScanLine } from 'lucide-react';
import {
  getMonitorDocumentHistory,
  postMonitorDocumentRetry,
  postMonitorDocumentRerunOcr,
  type DocumentHistoryResponse,
} from '@/app/api/monitoring';
import { Card, StatusBadge, SeverityBadge, timeAgo, formatMs, formatDate, Loading, ErrorText } from './monitor/ui';

export default function DocumentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [data, setData] = useState<DocumentHistoryResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState('');

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    const fetch = async () => {
      try {
        const res = await getMonitorDocumentHistory(id);
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

  const refetch = async () => {
    if (!id) return;
    try {
      setData(await getMonitorDocumentHistory(id));
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  };

  const retry = async () => {
    if (!id) return;
    setBusy('retry');
    try {
      const res = await postMonitorDocumentRetry(id);
      toast.success(res.action === 'requeued_failed_run' ? 'Failed run requeued' : 'New run created');
      await refetch();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Retry failed');
    } finally {
      setBusy('');
    }
  };

  const rerunOcr = async () => {
    if (!id) return;
    setBusy('ocr');
    try {
      const res = await postMonitorDocumentRerunOcr(id);
      toast.success('OCR re-run enqueued');
      await refetch();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Re-run OCR failed');
    } finally {
      setBusy('');
    }
  };

  if (loading) return <Loading />;
  if (error && !data) return <ErrorText>{error}</ErrorText>;
  if (!data) return <ErrorText>No data</ErrorText>;

  const doc = data.document;
  const allFailed = data.runs.filter((r) => r.status === 'failed');
  const latestFailed = allFailed[allFailed.length - 1];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/monitoring/documents')} className="inline-flex items-center gap-1.5 text-sm font-semibold px-3 py-1.5 rounded-lg border" style={{ borderColor: 'var(--border)' }}>
            <ArrowLeft className="w-4 h-4" />Back
          </button>
          <div>
            <h1 className="text-xl font-bold tracking-tight">Document {doc.id.slice(0, 8)}</h1>
            <p className="text-muted-foreground text-xs mt-0.5">Processing history & controls</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={retry} disabled={!latestFailed || !!busy}
            className="inline-flex items-center gap-1.5 text-sm font-semibold px-3 py-1.5 rounded-lg border disabled:opacity-40" style={{ borderColor: 'var(--border)' }}>
            <RotateCcw className={`w-4 h-4 ${busy === 'retry' ? 'animate-spin' : ''}`} />Retry
          </button>
          <button onClick={rerunOcr} disabled={!!busy}
            className="inline-flex items-center gap-1.5 text-sm font-semibold px-3 py-1.5 rounded-lg border disabled:opacity-40" style={{ borderColor: 'var(--border)' }}>
            <ScanLine className={`w-4 h-4 ${busy === 'ocr' ? 'animate-spin' : ''}`} />Re-run OCR
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card title="Document">
          <dl className="space-y-1.5 text-sm">
            <div className="flex justify-between gap-3"><dt className="text-muted-foreground">Type</dt><dd className="font-medium">{doc.document_type || '—'}</dd></div>
            <div className="flex justify-between gap-3"><dt className="text-muted-foreground">Created</dt><dd className="tabular-nums">{timeAgo(doc.created_at)}</dd></div>
            <div className="flex justify-between gap-3"><dt className="text-muted-foreground">Tenant</dt><dd className="font-medium">{doc.tenant_id.slice(0, 8)}</dd></div>
            <div className="flex justify-between gap-3"><dt className="text-muted-foreground">Storage</dt><dd className="truncate max-w-[180px]">{doc.source_storage_path || doc.provider_path || '—'}</dd></div>
          </dl>
        </Card>

        <Card title="Latest failure">
          {latestFailed ? (
            <div>
              <div className="flex items-center gap-2 mb-2"><StatusBadge value="failed" /><span className="text-xs text-muted-foreground">{formatDate(latestFailed.completed_at)}</span></div>
              <p className="text-xs text-red-600 dark:text-red-400 break-words leading-relaxed">{latestFailed.error || 'Unknown error'}</p>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground py-4 text-center font-medium">No failed runs</p>
          )}
        </Card>

        <Card title="Intake events">
          {(data.intake_events ?? []).length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center font-medium">None recorded</p>
          ) : (
            <div className="space-y-2">
              {(data.intake_events ?? []).map((i) => (
                <div key={i.id} className="flex items-center justify-between text-xs">
                  <span className="font-medium">{i.from_number}</span>
                  <span className="flex items-center gap-2"><StatusBadge value={i.status} /><span className="text-muted-foreground tabular-nums">{timeAgo(i.created_at)}</span></span>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      <div className="space-y-4">
        {(data.runs ?? []).length === 0 ? (
          <Card><p className="text-sm text-muted-foreground text-center py-8 font-medium">No Jarvis runs for this document</p></Card>
        ) : (
          data.runs.map((run) => (
            <Card key={run.run_id} title={`Run ${run.run_id.slice(0, 8)}`}
              right={<div className="flex items-center gap-2"><StatusBadge value={run.status} /><span className="text-xs text-muted-foreground tabular-nums">{formatMs(run.latency_ms)}</span></div>}
              subtitle={`${run.trigger_source || '—'} · started ${timeAgo(run.started_at)}`}>
              {run.error && (
                <div className="mb-3 rounded-md px-3 py-2 text-xs text-red-600 dark:text-red-400" style={{ backgroundColor: 'rgba(239,68,68,0.08)' }}>
                  {run.error}
                </div>
              )}
              <div className="relative space-y-0">
                {run.events.length === 0 ? (
                  <p className="text-xs text-muted-foreground py-2">No stage events recorded</p>
                ) : (
                  run.events.map((ev, i) => (
                    <div key={ev.id} className="flex gap-3">
                      <div className="flex flex-col items-center">
                        <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: ev.severity === 'error' ? '#ef4444' : ev.severity === 'warn' ? '#f59e0b' : '#5e6ad2', marginTop: 5 }} />
                        {i < run.events.length - 1 && <span className="w-px flex-1" style={{ backgroundColor: 'var(--border)' }} />}
                      </div>
                      <div className="pb-4 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-medium">{ev.status ?? ev.type}</span>
                          <SeverityBadge value={ev.severity} />
                          <span className="text-xs text-muted-foreground tabular-nums">{timeAgo(ev.created_at)}</span>
                        </div>
                        {ev.message && <div className="text-xs text-muted-foreground mt-0.5 break-words">{ev.message}</div>}
                        {ev.details && Object.keys(ev.details).length > 0 && (
                          <pre className="mt-1 rounded-md p-2.5 overflow-x-auto text-[11px] leading-relaxed" style={{ backgroundColor: 'var(--accent)' }}>{JSON.stringify(ev.details, null, 2)}</pre>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
