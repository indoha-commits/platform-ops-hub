import { useEffect, useState } from 'react';
import { Building2, Settings2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getAdminTenants } from '@/app/api/ops';
import type { AdminTenantRow } from '@/app/api/ops';

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
      <div className="flex-1 h-2 rounded-full max-w-[120px]" style={{ backgroundColor: 'var(--border)' }}>
        <div className="h-2 rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: color }} />
      </div>
      <span className="text-xs font-semibold w-20 text-right tabular-nums">{used.toLocaleString()}/{cap.toLocaleString()}</span>
    </div>
  );
}

export default function TenantsPage() {
  const [tenants, setTenants] = useState<AdminTenantRow[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    let cancelled = false;
    getAdminTenants()
      .then(d => { if (!cancelled) setTenants(d.tenants); })
      .catch(() => { if (!cancelled) setTenants(MOCK_TENANTS); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  if (loading) return <div className="flex items-center justify-center h-64 text-muted-foreground text-base">Loading…</div>;

  const statusCount = tenants.filter(t => t.status === 'active').length;

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Tenants</h1>
          <p className="text-muted-foreground text-sm mt-1">{tenants.length} total &middot; {statusCount} active</p>
        </div>
        {tenants.length > 0 && (
          <div className="text-right">
            <div className="text-3xl font-bold tracking-tight">{tenants.length}</div>
            <div className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Total</div>
          </div>
        )}
      </div>
      <div className="rounded-xl border overflow-hidden" style={{ borderColor: 'var(--border)' }}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b" style={{ borderColor: 'var(--border)' }}>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground text-left">Company</th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground text-left">Tier</th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground text-left">Cargo</th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground text-left">WhatsApp</th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground text-left">OCR</th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground text-left">AI</th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground text-right">Est. Bill</th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground text-left">Status</th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground text-right">Manage</th>
              </tr>
            </thead>
            <tbody>
              {tenants.map(t => (
                <tr key={t.id} className="border-t cursor-pointer hover:bg-accent/50 transition-colors" style={{ borderColor: 'var(--border)' }} onClick={() => navigate(`/tenant/${t.id}`)}>
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: '#5e6ad215' }}>
                        <Building2 className="w-4 h-4" style={{ color: '#5e6ad2' }} />
                      </div>
                      <div>
                        <div className="font-semibold text-sm">{t.company_name}</div>
                        <div className="text-xs text-muted-foreground">{t.subdomain}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3.5">
                    <span className="capitalize text-sm font-medium">{t.pricing_tier}</span>
                  </td>
                  <td className="px-4 py-3.5 min-w-[160px]"><UsageBar used={t.usage} cap={t.shipment_cap} /></td>
                  <td className="px-4 py-3.5 min-w-[160px]"><UsageBar used={0} cap={t.whatsapp_cap} /></td>
                  <td className="px-4 py-3.5 min-w-[160px]"><UsageBar used={0} cap={t.ocr_cap} /></td>
                  <td className="px-4 py-3.5 min-w-[160px]"><UsageBar used={0} cap={t.ai_cap} /></td>
                  <td className="px-4 py-3.5 font-semibold text-sm text-right tabular-nums">${t.estimated_bill.toLocaleString()}</td>
                  <td className="px-4 py-3.5">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                      t.status === 'active' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                      t.status === 'pending_payment' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' :
                      'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
                    }`}>
                      {t.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 text-right">
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); navigate(`/tenant/${t.id}`); }}
                      className="inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-semibold transition-colors hover:bg-accent"
                      style={{ borderColor: 'var(--border)' }}
                    >
                      <Settings2 className="w-3.5 h-3.5" /> Manage
                    </button>
                  </td>
                </tr>
              ))}
              {tenants.length === 0 && (
                <tr><td colSpan={9} className="px-4 py-12 text-center text-muted-foreground text-sm">No tenants found</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
