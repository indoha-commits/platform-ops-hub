import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { AlertTriangle, CheckCircle2, Download, RefreshCw } from 'lucide-react';
import { getAdminStats, getAdminTenants, getAdminPayments, getPaymentReport, verifyAdminPayment } from '@/app/api/ops';
import type { AdminStats, AdminTenantRow, AdminPaymentRow, PaymentReportResponse, PaymentReportRow } from '@/app/api/ops';

const MOCK_STATS: AdminStats = {
  mrr: 2750, arr: 33000, total_tenants: 4, active_tenants: 3,
  tier_breakdown: { starter: 1, growth: 1, custom: 2 },
  current_month: new Date().toISOString().slice(0, 7),
  total_usage: { cargo_count: 142, whatsapp_message_count: 3400, ocr_doc_count: 520, ai_extraction_count: 180 },
};

const MOCK_TENANTS: AdminTenantRow[] = [
  { id: '1', company_name: 'Acme Freight Ltd', subdomain: 'acme', slug: 'acme', status: 'active', pricing_tier: 'growth', shipment_cap: 100, overage_rate: 6, whatsapp_cap: 2000, ocr_cap: 400, ai_cap: 100, whatsapp_overage_rate: 0.02, ocr_overage_rate: 0.10, ai_overage_rate: 0.15, ai_conversation_enabled: true, jarvis_auto_extract: true, jarvis_auto_create: true, doc_analysis_enabled: true, usage: 42, usage_pct: 42, estimated_bill: 500, created_at: '2026-01-15' },
  { id: '2', company_name: 'Global Shipping Co', subdomain: 'global', slug: 'global', status: 'active', pricing_tier: 'starter', shipment_cap: 30, overage_rate: 6, whatsapp_cap: 500, ocr_cap: 90, ai_cap: 30, whatsapp_overage_rate: 0.02, ocr_overage_rate: 0.10, ai_overage_rate: 0.15, ai_conversation_enabled: false, jarvis_auto_extract: false, jarvis_auto_create: false, doc_analysis_enabled: false, usage: 28, usage_pct: 93, estimated_bill: 238, created_at: '2026-03-01' },
  { id: '3', company_name: 'East Africa Logistics', subdomain: 'eal', slug: 'eal', status: 'active', pricing_tier: 'custom', shipment_cap: null, overage_rate: null, whatsapp_cap: null, ocr_cap: 90, ai_cap: 30, whatsapp_overage_rate: null, ocr_overage_rate: null, ai_overage_rate: null, ai_conversation_enabled: true, jarvis_auto_extract: true, jarvis_auto_create: true, doc_analysis_enabled: true, usage: 310, usage_pct: null, estimated_bill: 0, created_at: '2026-02-10' },
  { id: '4', company_name: 'Transit Express', subdomain: 'transit', slug: 'transit', status: 'pending_payment', pricing_tier: 'starter', shipment_cap: 30, overage_rate: 6, whatsapp_cap: 500, ocr_cap: 90, ai_cap: 30, whatsapp_overage_rate: 0.02, ocr_overage_rate: 0.10, ai_overage_rate: 0.15, ai_conversation_enabled: false, jarvis_auto_extract: false, jarvis_auto_create: false, doc_analysis_enabled: false, usage: 0, usage_pct: 0, estimated_bill: 250, created_at: '2026-07-28' },
];

function UsageBar({ used, cap }: { used: number; cap: number | null }) {
  if (!cap || cap <= 0) return <span className="text-xs text-muted-foreground font-medium">Unlimited</span>;
  const pct = Math.min(100, Math.round((used / cap) * 100));
  const color = pct >= 90 ? '#ef4444' : pct >= 70 ? '#f59e0b' : '#22c55e';
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-2 rounded-full max-w-[100px]" style={{ backgroundColor: 'var(--border)' }}>
        <div className="h-2 rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: color }} />
      </div>
      <span className="text-xs font-semibold tabular-nums w-10 text-right">{pct}%</span>
    </div>
  );
}

type StatusTab = 'pending_confirmation' | 'completed' | 'failed' | 'all';

const STATUS_TABS: { key: StatusTab; label: string }[] = [
  { key: 'pending_confirmation', label: 'Awaiting verification' },
  { key: 'completed', label: 'Verified' },
  { key: 'failed', label: 'Failed' },
  { key: 'all', label: 'All' },
];

function formatMoney(currency: string, amount: number): string {
  return `${currency} ${Number.isFinite(amount) ? amount.toLocaleString('en-GB') : amount}`;
}

function fmtDate(iso?: string | null): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '—';
  return d.toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' });
}

function statusBadgeClass(status: string): string {
  switch (status) {
    case 'completed': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
    case 'pending_confirmation': return 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200';
    case 'failed': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
    case 'pending': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
    default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
  }
}

function downloadCsv(report: PaymentReportResponse) {
  const cols = ['date', 'tenant', 'invoice', 'intent_type', 'status', 'amount', 'currency', 'momo_transaction_id', 'payer_phone', 'payer_name', 'created_at', 'updated_at', 'last_error'];
  const esc = (v: unknown) => {
    const s = String(v ?? '');
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const rows = report.payments.map((p: PaymentReportRow) =>
    [report.date, p.tenant_name, p.invoice_number, p.intent_type, p.status, p.amount, p.currency, p.momo_transaction_id, p.payer_phone, p.payer_name, p.created_at, p.updated_at, p.last_error].map(esc).join(',')
  );
  const csv = [cols.join(','), ...rows].join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `reconciliation-${report.date}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export default function BillingPage() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [tenants, setTenants] = useState<AdminTenantRow[]>([]);
  const [payments, setPayments] = useState<AdminPaymentRow[]>([]);
  const [verifyingId, setVerifyingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<StatusTab>('pending_confirmation');

  const [report, setReport] = useState<PaymentReportResponse | null>(null);
  const [reportLoading, setReportLoading] = useState(false);
  const [reportDate, setReportDate] = useState(() => new Date().toISOString().slice(0, 10));

  const load = () => {
    Promise.all([
      getAdminStats().catch(() => MOCK_STATS),
      getAdminTenants().catch(() => ({ tenants: MOCK_TENANTS })),
      getAdminPayments(activeTab === 'all' ? undefined : activeTab).catch(() => ({ payments: [] })),
    ]).then(([s, t, p]) => {
      setStats(s); setTenants(t.tenants); setPayments(p.payments);
    }).catch(() => {}).finally(() => setLoading(false));
  };

  const loadReport = (date: string) => {
    setReportLoading(true);
    getPaymentReport(date)
      .then((r) => setReport(r))
      .catch((e) => {
        toast.error(e?.message || 'Failed to load reconciliation report');
        setReport(null);
      })
      .finally(() => setReportLoading(false));
  };

  useEffect(() => { load(); }, [activeTab]);
  useEffect(() => { loadReport(reportDate); }, []);

  const handleVerify = async (payment: AdminPaymentRow) => {
    if (!window.confirm(`Verify payment for ${payment.tenant_name || payment.tenant_id} (${formatMoney(payment.currency, payment.amount)})? This activates the tenant and emails their dashboard credentials.`)) return;
    setVerifyingId(payment.id);
    try {
      await verifyAdminPayment(payment.id);
      toast.success(`Payment verified — ${payment.tenant_name || 'tenant'} activated.`);
      load();
      loadReport(reportDate);
    } catch (e: any) {
      toast.error(e?.message || 'Verification failed');
    } finally {
      setVerifyingId(null);
    }
  };

  if (loading) return <div className="flex items-center justify-center h-64 text-muted-foreground text-base">Loading…</div>;

  const totalBill = tenants.reduce((sum, t) => sum + t.estimated_bill, 0);
  const s = report?.summary;

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Billing Overview</h1>
          <p className="text-muted-foreground text-sm mt-1">Revenue, usage, and payment verification across all tenants</p>
        </div>
        {stats && (
          <div className="text-right">
            <div className="text-3xl font-bold tracking-tight tabular-nums">${stats.mrr.toLocaleString()}</div>
            <div className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">MRR</div>
          </div>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border p-5" style={{ borderColor: 'var(--border)' }}>
          <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Monthly Recurring Revenue</div>
          <div className="text-3xl font-bold tracking-tight mt-1.5 tabular-nums">${(stats?.mrr ?? 0).toLocaleString()}</div>
        </div>
        <div className="rounded-xl border p-5" style={{ borderColor: 'var(--border)' }}>
          <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Annual Run Rate</div>
          <div className="text-3xl font-bold tracking-tight mt-1.5 tabular-nums">${(stats?.arr ?? 0).toLocaleString()}</div>
        </div>
        <div className="rounded-xl border p-5" style={{ borderColor: 'var(--border)' }}>
          <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Estimated Total (current month)</div>
          <div className="text-3xl font-bold tracking-tight mt-1.5 tabular-nums">${totalBill.toLocaleString()}</div>
        </div>
      </div>

      {/* Reconciliation panel */}
      <div className="rounded-xl border overflow-hidden" style={{ borderColor: 'var(--border)' }}>
        <div className="px-4 py-3 border-b flex flex-wrap items-center justify-between gap-3" style={{ borderColor: 'var(--border)' }}>
          <div className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Daily reconciliation</div>
          <div className="flex items-center gap-2 flex-wrap">
            <input
              type="date"
              value={reportDate}
              onChange={(e) => { setReportDate(e.target.value); loadReport(e.target.value); }}
              className="rounded-lg border px-3 py-1.5 text-sm bg-transparent"
              style={{ borderColor: 'var(--border)' }}
            />
            <button
              type="button"
              onClick={() => loadReport(reportDate)}
              disabled={reportLoading}
              className="inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm font-semibold transition-opacity disabled:opacity-50"
              style={{ borderColor: 'var(--border)' }}
            >
              <RefreshCw className={`w-3.5 h-3.5 ${reportLoading ? 'animate-spin' : ''}`} /> Refresh
            </button>
            <button
              type="button"
              onClick={() => report && downloadCsv(report)}
              disabled={!report || report.payments.length === 0}
              className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-semibold text-white transition-opacity disabled:opacity-50"
              style={{ backgroundColor: '#5e6ad2' }}
            >
              <Download className="w-3.5 h-3.5" /> Export CSV
            </button>
          </div>
        </div>
        <div className="p-4 grid gap-3 sm:grid-cols-4">
          <div className="rounded-lg border p-4" style={{ borderColor: 'var(--border)' }}>
            <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Awaiting verification</div>
            <div className="text-2xl font-bold mt-1 tabular-nums">{s?.pending_confirmation.count ?? 0}</div>
            <div className="text-xs text-muted-foreground mt-1">{formatMoney('RWF', s?.pending_confirmation.total ?? 0)}</div>
          </div>
          <div className="rounded-lg border p-4" style={{ borderColor: 'var(--border)' }}>
            <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Verified</div>
            <div className="text-2xl font-bold mt-1 tabular-nums">{s?.completed.count ?? 0}</div>
            <div className="text-xs text-muted-foreground mt-1">{formatMoney('RWF', s?.completed.total ?? 0)}</div>
          </div>
          <div className="rounded-lg border p-4" style={{ borderColor: 'var(--border)' }}>
            <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Failed</div>
            <div className="text-2xl font-bold mt-1 tabular-nums">{s?.failed.count ?? 0}</div>
            <div className="text-xs text-muted-foreground mt-1">{formatMoney('RWF', s?.failed.total ?? 0)}</div>
          </div>
          <div className="rounded-lg border p-4" style={{ borderColor: 'var(--border)' }}>
            <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Total</div>
            <div className="text-2xl font-bold mt-1 tabular-nums">{s?.total.count ?? 0}</div>
            <div className="text-xs text-muted-foreground mt-1">{formatMoney('RWF', s?.total.total ?? 0)}</div>
          </div>
        </div>
        {report && report.payments.length > 0 && (
          <div className="overflow-x-auto border-t" style={{ borderColor: 'var(--border)' }}>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b" style={{ borderColor: 'var(--border)' }}>
                  <th className="px-4 py-2.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground text-left">Tenant</th>
                  <th className="px-4 py-2.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground text-left">Status</th>
                  <th className="px-4 py-2.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground text-left">Claimed MoMo SMS transaction ID</th>
                  <th className="px-4 py-2.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground text-right">Amount</th>
                  <th className="px-4 py-2.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground text-left">Created</th>
                  <th className="px-4 py-2.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground text-left">Notes</th>
                </tr>
              </thead>
              <tbody>
                {report.payments.map((p) => (
                  <tr key={p.id} className="border-t align-top" style={{ borderColor: 'var(--border)' }}>
                    <td className="px-4 py-3">
                      <div className="font-semibold">{p.tenant_name || p.tenant_id}</div>
                      <div className="text-xs text-muted-foreground font-mono">{p.invoice_number || ''}</div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${statusBadgeClass(p.status)}`}>
                        {p.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-mono text-xs font-semibold">{p.momo_transaction_id || '—'}</div>
                      {p.payer_phone && <div className="text-xs text-muted-foreground">Payer: {p.payer_phone}{p.payer_name ? ` (${p.payer_name})` : ''}</div>}
                    </td>
                    <td className="px-4 py-3 font-bold text-right tabular-nums">{formatMoney(p.currency, p.amount)}</td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">{fmtDate(p.created_at)}</td>
                    <td className="px-4 py-3 text-xs">
                      {p.last_error ? (
                        <span className="inline-flex items-center gap-1 text-amber-700 dark:text-amber-300">
                          <AlertTriangle className="w-3.5 h-3.5 shrink-0" /> {p.last_error}
                        </span>
                      ) : p.status === 'completed' ? (
                        <span className="inline-flex items-center gap-1 text-green-700 dark:text-green-300">
                          <CheckCircle2 className="w-3.5 h-3.5 shrink-0" /> Verified {p.confirmed_at ? fmtDate(p.confirmed_at) : ''}
                        </span>
                      ) : <span className="text-muted-foreground">—</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Verification queue */}
      <div className="rounded-xl border overflow-hidden" style={{ borderColor: 'var(--border)' }}>
        <div className="px-4 py-3 border-b flex flex-wrap items-center justify-between gap-3" style={{ borderColor: 'var(--border)' }}>
          <div className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Payment verification queue</div>
          <div className="flex items-center gap-1 flex-wrap">
            {STATUS_TABS.map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key)}
                className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors ${activeTab === tab.key ? 'text-white' : 'text-muted-foreground hover:text-foreground'}`}
                style={activeTab === tab.key ? { backgroundColor: '#5e6ad2' } : { border: '1px solid var(--border)' }}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b" style={{ borderColor: 'var(--border)' }}>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground text-left">Tenant</th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground text-left">Claimed MoMo SMS transaction ID</th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground text-right">Expected</th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {payments.map((p) => (
                <tr key={p.id} className="border-t" style={{ borderColor: 'var(--border)' }}>
                  <td className="px-4 py-3.5">
                    <div className="font-semibold">{p.tenant_name || p.tenant_id}</div>
                    <div className="text-xs text-muted-foreground font-mono">{p.id.slice(0, 8)} · {p.invoice_number || '—'}</div>
                  </td>
                  <td className="px-4 py-3.5">
                    <div className="font-mono text-xs font-semibold text-amber-700 dark:text-amber-300">{p.momo_transaction_id || '—'}</div>
                    {p.payer_phone && <div className="text-xs text-muted-foreground">Payer: {p.payer_phone}{p.payer_name ? ` (${p.payer_name})` : ''}</div>}
                    {p.last_error && (
                      <div className="text-xs text-amber-600 dark:text-amber-400 mt-1">⚠ {p.last_error}</div>
                    )}
                  </td>
                  <td className="px-4 py-3.5 font-bold text-right tabular-nums">{formatMoney(p.currency, p.amount)}</td>
                  <td className="px-4 py-3.5 text-right">
                    <button
                      onClick={() => handleVerify(p)}
                      disabled={verifyingId === p.id}
                      className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-semibold text-white transition-opacity disabled:opacity-50"
                      style={{ backgroundColor: '#22c55e' }}
                    >
                      {verifyingId === p.id ? 'Verifying…' : 'Verify payment'}
                    </button>
                  </td>
                </tr>
              ))}
              {payments.length === 0 && (
                <tr><td colSpan={4} className="px-4 py-10 text-center text-muted-foreground text-sm">No payments in this state</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="rounded-xl border overflow-hidden" style={{ borderColor: 'var(--border)' }}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b" style={{ borderColor: 'var(--border)' }}>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground text-left">Company</th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground text-left">Tier</th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground text-right">Cargo Used</th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground text-right">Cargo Cap</th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground text-left">Usage %</th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground text-right">Est. Bill</th>
              </tr>
            </thead>
            <tbody>
              {tenants.map(t => (
                <tr key={t.id} className="border-t" style={{ borderColor: 'var(--border)' }}>
                  <td className="px-4 py-3.5">
                    <div className="font-semibold text-sm">{t.company_name}</div>
                    <div className="text-xs text-muted-foreground font-medium capitalize">{t.pricing_tier}</div>
                  </td>
                  <td className="px-4 py-3.5">
                    <span className="capitalize text-sm font-medium">{t.pricing_tier}</span>
                  </td>
                  <td className="px-4 py-3.5 text-right font-medium tabular-nums">{t.usage.toLocaleString()}</td>
                  <td className="px-4 py-3.5 text-right font-medium">{t.shipment_cap?.toLocaleString() ?? <span className="text-muted-foreground">—</span>}</td>
                  <td className="px-4 py-3.5 min-w-[140px]"><UsageBar used={t.usage} cap={t.shipment_cap} /></td>
                  <td className="px-4 py-3.5 font-bold text-right tabular-nums">${t.estimated_bill.toLocaleString()}</td>
                </tr>
              ))}
              {tenants.length === 0 && (
                <tr><td colSpan={6} className="px-4 py-12 text-center text-muted-foreground text-sm font-medium">No tenants found</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}