import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { RotateCcw, ExternalLink } from 'lucide-react';
import { getMonitorQueue, postMonitorStorageJobRetry, postMonitorDocumentRetry, type MonitorQueueResponse } from '@/app/api/monitoring';
import { Card, StatusBadge, timeAgo, Loading, ErrorText } from './monitor/ui';

export default function QueuesJobsPage() {
  const navigate = useNavigate();
  const [data, setData] = useState<MonitorQueueResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState<string>('');

  useEffect(() => {
    let cancelled = false;
    const fetch = async () => {
      try {
        const res = await getMonitorQueue();
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
  }, []);

  const refetch = async () => {
    try {
      setData(await getMonitorQueue());
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  };

  const retryStorageJob = async (jobId: string) => {
    setBusy(`job-${jobId}`);
    try {
      await postMonitorStorageJobRetry(jobId);
      toast.success('Storage job requeued');
      await refetch();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Retry failed');
    } finally {
      setBusy('');
    }
  };

  const retryDocument = async (documentId: string) => {
    setBusy(`doc-${documentId}`);
    try {
      const res = await postMonitorDocumentRetry(documentId);
      toast.success(res.action === 'requeued_failed_run' ? 'Run requeued' : 'New run created');
      await refetch();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Retry failed');
    } finally {
      setBusy('');
    }
  };

  if (loading) return <Loading />;
  if (error && !data) return <ErrorText>{error}</ErrorText>;

  const stuckRuns = data?.stuck_agent_runs ?? [];
  const stuckWa = data?.stuck_whatsapp_pending ?? [];
  const failedJobs = data?.failed_storage_jobs ?? [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Queues & Jobs</h1>
        <p className="text-muted-foreground text-sm mt-1">Stuck document-intel runs, WhatsApp pending rows and failed storage jobs</p>
      </div>

      <Card title={`Stuck document-intel runs (${stuckRuns.length})`} subtitle={`Running > ${data?.thresholds.running_minutes}m or queued > ${data?.thresholds.queued_minutes}m`}>
        {stuckRuns.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4 text-center font-medium">No stuck runs</p>
        ) : (
          <div className="space-y-2">
            {stuckRuns.map((r) => (
              <div key={r.id} className="flex items-center justify-between gap-3 rounded-md px-3 py-2 text-sm" style={{ backgroundColor: 'var(--accent)' }}>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <StatusBadge value={r.status} />
                    <span className="font-medium truncate">{r.trigger_source || r.id.slice(0, 8)}</span>
                  </div>
                  {r.error && <div className="text-xs text-red-500 mt-0.5 truncate">{r.error}</div>}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-xs text-muted-foreground tabular-nums">{timeAgo(r.created_at)}</span>
                  <button onClick={() => navigate(`/monitoring/document/${r.document_id}`)} className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded border" style={{ borderColor: 'var(--border)' }}><ExternalLink className="w-3.5 h-3.5" />Inspect</button>
                  <button onClick={() => retryDocument(r.document_id)} disabled={busy === `doc-${r.document_id}`}
                    className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded border disabled:opacity-50" style={{ borderColor: 'var(--border)' }}>
                    <RotateCcw className={`w-3.5 h-3.5 ${busy === `doc-${r.document_id}` ? 'animate-spin' : ''}`} />Retry
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Card title={`Stuck WhatsApp pending rows (${stuckWa.length})`} subtitle="Webhook rows stuck in 'processing' beyond the timeout">
        {stuckWa.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4 text-center font-medium">No stuck rows</p>
        ) : (
          <div className="space-y-2">
            {stuckWa.map((w) => (
              <div key={w.id} className="flex items-center justify-between gap-3 rounded-md px-3 py-2 text-sm" style={{ backgroundColor: 'var(--accent)' }}>
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <StatusBadge value={w.status} />
                  <span className="font-medium">{w.provider}</span>
                  <span className="text-xs text-muted-foreground tabular-nums">{w.attempts} attempts</span>
                </div>
                <span className="text-xs text-muted-foreground tabular-nums shrink-0">{timeAgo(w.received_at)}</span>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Card title={`Failed storage jobs (${failedJobs.length})`} subtitle="Requeeable — the storage push cron will pick them up">
        {failedJobs.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4 text-center font-medium">No failed storage jobs</p>
        ) : (
          <div className="space-y-2">
            {failedJobs.map((j) => (
              <div key={j.id} className="flex items-center justify-between gap-3 rounded-md px-3 py-2 text-sm" style={{ backgroundColor: 'var(--accent)' }}>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <StatusBadge value={j.status} />
                    <span className="text-xs text-muted-foreground">{j.attempts} attempts</span>
                  </div>
                  {j.last_error && <div className="text-xs text-red-500 mt-0.5 truncate">{j.last_error}</div>}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-xs text-muted-foreground tabular-nums">{timeAgo(j.updated_at)}</span>
                  <button onClick={() => retryStorageJob(j.id)} disabled={busy === `job-${j.id}`}
                    className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded border disabled:opacity-50" style={{ borderColor: 'var(--border)' }}>
                    <RotateCcw className={`w-3.5 h-3.5 ${busy === `job-${j.id}` ? 'animate-spin' : ''}`} />Retry
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
