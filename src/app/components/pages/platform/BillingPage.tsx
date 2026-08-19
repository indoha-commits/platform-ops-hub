import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { getAdminStats, getAdminTenants, getAdminPayments, verifyAdminPayment } from '@/app/api/ops';
import type { AdminStats, AdminTenantRow, AdminPaymentRow } from '@/app/api/ops';

const MOCK_STATS: AdminStats = {
  mrr: 2750, arr: 33000, total_tenants: 4, active_tenants: 3,
  tier_breakdown: { starter: 1, growth: 1, custom: 2 },
  current_month: new Date().toISOString().slice(0, 7),
  total_usage: { cargo_count: 142, whatsapp_message_count: 3400, ocr_doc_count: 520, ai_extraction_count: 180 },
};

const MOCK_TENANTS: AdminTenantRow[] = [
  { id: '1', company_name: 'Acme Freight Ltd', subdomain: 'acme', slug: 'acme', status: 'active', pricing_tier: 'growth', shipment_cap: 100, overage_rate: 6, whatsapp_cap: 2000, ocr_cap: 400, ai_cap: 100, whatsapp_overage_rate: 0.02, ocr_overage_rate: 0.10, ai_overage_rate: 0.15, ai_conversation_enabled: true, jarvis_auto_extract: true, jarvis_auto_create: true, doc_analysis_enabled: true, usage: 42, usage_pct: 42, estimated_bill: 500, created_at: '2026-01-15' },
  { id: '2', company_name: 'Global Shipping Co', subdomain: 'global', slug: 'global', status: 'active', pricing_tier: 'starter', shipment_cap: 30, overage_rate: 6, whatsapp_cap: 500, ocr_cap: 90, ai_cap: 30, whatsapp_overage_rate: 0.02, ocr_overage_rate: 0.10, ai_overage_rate: 0.15, ai_conversation_enabled: false, jarvis_auto_extract: false, jarvis_auto_create: false, doc_analysis_enabled: false, usage: 28, usage_pct: 93, estimated_bill: 238, created_at: '2026-03-01' },
  { id: '3', company_name: 'East Africa Logistics', subdomain: 'eal', slug: 'eal', status: 'active', pricing_tier: 'custom', shipment_cap: null, overage_rate: null, whatsapp_cap: null, ocr_cap: null, ai_cap: null, whatsapp_overage_rate: null, ocr_overage_rate: null, ai_overage_rate: null, ai_conversation_enabled: true, jarvis_auto_extract: true, jarvis_auto_create: true, doc_analysis_enabled: true, usage: 310, usage_pct: null, estimated_bill: 0, created_at: '2026-02-10' },
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

export default function BillingPage() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [tenants, setTenants] = useState<AdminTenantRow[]>([]);
  const [payments, setPayments] = useState<AdminPaymentRow[]>([]);
  const [verifyingId, setVerifyingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = () => {
    Promise.all([
      getAdminStats().catch(() => MOCK_STATS),
      getAdminTenants().catch(() => ({ tenants: MOCK_TENANTS })),
      getAdminPayments('pending_confirmation').catch(() => ({ payments: [] })),
    ]).then(([s, t, p]) => {
      setStats(s); setTenants(t.tenants); setPayments(p.payments);
    }).catch(() => {}).finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const handleVerify = async (payment: AdminPaymentRow) => {
    if (!window.confirm(`Verify payment for ${payment.tenant_name || payment.tenant_id} (${payment.currency} ${payment.amount})? This activates the tenant and emails their dashboard credentials.`)) return;
    setVerifyingId(payment.id);
    try {
      await verifyAdminPayment(payment.id);
      toast.success(`Payment verified — ${payment.tenant_name || 'tenant'} activated.`);
      load();
    } catch (e: any) {
      toast.error(e?.message || 'Verification failed');
    } finally {
      setVerifyingId(null);
    }
  };

  if (loading) return <div className="flex items-center justify-center h-64 text-muted-foreground text-base">Loading…</div>;

  const totalBill = tenants.reduce((sum, t) => sum + t.estimated_bill, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Billing Overview</h1>
          <p className="text-muted-foreground text-sm mt-1">Revenue and usage across all tenants</p>
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

      {payments.length > 0 && (
        <div className="rounded-xl border overflow-hidden" style={{ borderColor: 'var(--border)' }}>
          <div className="px-4 py-3 border-b flex items-center justify-between" style={{ borderColor: 'var(--border)' }}>
            <div className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Pending MoMo confirmations</div>
            <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-700 dark:text-amber-300 text-xs font-semibold">
              {payments.length} awaiting verification
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b" style={{ borderColor: 'var(--border)' }}>
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground text-left">Tenant</th>
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground text-left">Invoice</th>
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground text-left">MoMo ref / transaction</th>
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground text-right">Amount</th>
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((p) => (
                  <tr key={p.id} className="border-t" style={{ borderColor: 'var(--border)' }}>
                    <td className="px-4 py-3.5">
                      <div className="font-semibold">{p.tenant_name || p.tenant_id}</div>
                      <div className="text-xs text-muted-foreground font-mono">{p.id.slice(0, 8)}</div>
                    </td>
                    <td className="px-4 py-3.5 font-mono text-xs">{p.invoice_number || '—'}</td>
                    <td className="px-4 py-3.5">
                      <div className="font-mono text-xs">{p.momo_reference || '—'}</div>
                      <div className="text-xs text-muted-foreground">Tx: {p.momo_transaction_id || '—'}</div>
                      {p.payer_phone && <div className="text-xs text-muted-foreground">Payer: {p.payer_phone}{p.payer_name ? ` (${p.payer_name})` : ''}</div>}
                    </td>
                    <td className="px-4 py-3.5 font-bold text-right tabular-nums">{p.currency} {p.amount.toLocaleString()}</td>
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
              </tbody>
            </table>
          </div>
        </div>
      )}
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
