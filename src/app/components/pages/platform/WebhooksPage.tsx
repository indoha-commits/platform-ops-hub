import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { RotateCcw, ExternalLink } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getMonitorWebhooks, postMonitorWebhookReplay, type MonitorWebhooksResponse, type WebhookReceipt } from '@/app/api/monitoring';
import { Card, StatusBadge, timeAgo, Loading, ErrorText } from './monitor/ui';

const PROVIDERS = ['all', 'meta', 'twilio', 'email', 'postmark', 'mailgun', 'momo', 'mpesa'];
const STATUSES = ['all', 'received', 'processed', 'failed', 'replayed'];

export default function WebhooksPage() {
  const navigate = useNavigate();
  const [data, setData] = useState<MonitorWebhooksResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [provider, setProvider] = useState('all');
  const [status, setStatus] = useState('all');
  const [busy, setBusy] = useState('');

  useEffect(() => {
    let cancelled = false;
    const fetch = async () => {
      setLoading(true);
      try {
        const res = await getMonitorWebhooks({
          provider: provider === 'all' ? undefined : provider,
          status: status === 'all' ? undefined : status,
          limit: 100,
        });
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
  }, [provider, status]);

  const replay = async (receipt: WebhookReceipt) => {
    setBusy(receipt.id);
    try {
      const res = await postMonitorWebhookReplay(receipt.id);
      if (res.ok) toast.success('Webhook replayed');
      else toast.error(res.reason || 'Replay failed');
      const next = await getMonitorWebhooks({
        provider: provider === 'all' ? undefined : provider,
        status: status === 'all' ? undefined : status,
        limit: 100,
      });
      setData(next);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Replay failed');
    } finally {
      setBusy('');
    }
  };

  const receipts = data?.receipts ?? [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Webhooks</h1>
        <p className="text-muted-foreground text-sm mt-1">Received webhook receipts — replayable (WhatsApp Meta only, going-forward)</p>
      </div>

      <div className="flex flex-wrap gap-2">
        <select value={provider} onChange={(e) => setProvider(e.target.value)}
          className="rounded-lg border px-2 py-1.5 text-sm" style={{ borderColor: 'var(--border)', backgroundColor: 'var(--background)' }}>
          {PROVIDERS.map((p) => <option key={p} value={p}>{p}</option>)}
        </select>
        <select value={status} onChange={(e) => setStatus(e.target.value)}
          className="rounded-lg border px-2 py-1.5 text-sm" style={{ borderColor: 'var(--border)', backgroundColor: 'var(--background)' }}>
          {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      {loading ? <Loading /> : error ? <ErrorText>{error}</ErrorText> : receipts.length === 0 ? (
        <Card><p className="text-sm text-muted-foreground text-center py-8 font-medium">No receipts match this filter</p></Card>
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wide text-muted-foreground border-b" style={{ borderColor: 'var(--border)' }}>
                  <th className="py-2 pr-3 font-semibold">Status</th>
                  <th className="py-2 pr-3 font-semibold">Provider</th>
                  <th className="py-2 pr-3 font-semibold">Path</th>
                  <th className="py-2 pr-3 font-semibold">Received</th>
                  <th className="py-2 pr-3 font-semibold">Signature</th>
                  <th className="py-2 pr-3 font-semibold">Error</th>
                  <th className="py-2 font-semibold" />
                </tr>
              </thead>
              <tbody>
                {receipts.map((r) => (
                  <tr key={r.id} className="border-b last:border-0" style={{ borderColor: 'var(--border)' }}>
                    <td className="py-2.5 pr-3"><StatusBadge value={r.status} /></td>
                    <td className="py-2.5 pr-3 font-medium">{r.provider}</td>
                    <td className="py-2.5 pr-3 text-xs text-muted-foreground">{r.path || '—'}</td>
                    <td className="py-2.5 pr-3 text-xs text-muted-foreground tabular-nums">{timeAgo(r.created_at)}</td>
                    <td className="py-2.5 pr-3 text-xs">
                      <span style={{ color: r.signature_valid ? '#22c55e' : '#ef4444' }}>{r.signature_valid ? 'valid' : 'invalid'}</span>
                    </td>
                    <td className="py-2.5 pr-3 text-xs text-red-500 max-w-[200px] truncate">{r.last_error || ''}</td>
                    <td className="py-2.5 text-right whitespace-nowrap">
                      <button onClick={() => replay(r)} disabled={!!busy || r.provider !== 'meta'}
                        title={r.provider === 'meta' ? 'Replay this webhook' : 'Replay supported for WhatsApp Meta webhooks'}
                        className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded border disabled:opacity-40"
                        style={{ borderColor: 'var(--border)' }}>
                        <RotateCcw className={`w-3.5 h-3.5 ${busy === r.id ? 'animate-spin' : ''}`} />Replay
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
