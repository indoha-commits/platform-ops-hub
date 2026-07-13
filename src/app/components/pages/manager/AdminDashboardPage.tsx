import { useEffect, useState } from 'react';
import { BarChart3, Building2, CreditCard, DollarSign, Users, Loader2, AlertTriangle, TrendingUp } from 'lucide-react';
import { getAdminStats, getAdminTenants, type AdminStats, type AdminTenantRow } from '@/app/api/ops';
import { PageHeader } from '@/app/components/PageHeader';

function fmtMoney(n: number) {
  return '$' + (Number.isFinite(n) ? n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0.00');
}

function fmtCompact(n: number) {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
  if (n >= 1_000) return (n / 1_000).toFixed(1) + 'K';
  return String(n);
}

export function AdminDashboardPage() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [tenants, setTenants] = useState<AdminTenantRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    setLoading(true);
    Promise.all([getAdminStats(), getAdminTenants()])
      .then(([s, t]) => {
        setStats(s);
        setTenants(t.tenants);
      })
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <PageHeader title="Admin Dashboard" icon={BarChart3} />
        <div className="mt-4 p-4 rounded bg-destructive/10 text-destructive text-sm flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          {error === 'forbidden' ? 'Access denied. Admin role required.' : error}
        </div>
      </div>
    );
  }

  if (!stats) return null;

  const tierColors: Record<string, string> = {
    basic: '#6b7280',
    pro: '#5e6ad2',
    enterprise: '#d4183d',
  };

  return (
    <div className="p-6 max-w-6xl">
      <PageHeader title="Admin Dashboard" icon={BarChart3} />

      {/* KPI cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6 mb-8">
        <div className="rounded-lg border p-4" style={{ borderColor: 'var(--border)' }}>
          <div className="flex items-center gap-2 text-xs uppercase tracking-wider mb-1" style={{ color: 'var(--muted-foreground)' }}>
            <DollarSign className="w-3.5 h-3.5" />
            MRR
          </div>
          <div className="text-2xl font-semibold">{fmtMoney(stats.mrr)}</div>
        </div>
        <div className="rounded-lg border p-4" style={{ borderColor: 'var(--border)' }}>
          <div className="flex items-center gap-2 text-xs uppercase tracking-wider mb-1" style={{ color: 'var(--muted-foreground)' }}>
            <TrendingUp className="w-3.5 h-3.5" />
            ARR
          </div>
          <div className="text-2xl font-semibold">{fmtMoney(stats.arr)}</div>
        </div>
        <div className="rounded-lg border p-4" style={{ borderColor: 'var(--border)' }}>
          <div className="flex items-center gap-2 text-xs uppercase tracking-wider mb-1" style={{ color: 'var(--muted-foreground)' }}>
            <Building2 className="w-3.5 h-3.5" />
            Tenants
          </div>
          <div className="text-2xl font-semibold">{stats.active_tenants} / {stats.total_tenants}</div>
          <div className="text-xs mt-1" style={{ color: 'var(--muted-foreground)' }}>active / total</div>
        </div>
        <div className="rounded-lg border p-4" style={{ borderColor: 'var(--border)' }}>
          <div className="flex items-center gap-2 text-xs uppercase tracking-wider mb-1" style={{ color: 'var(--muted-foreground)' }}>
            <CreditCard className="w-3.5 h-3.5" />
            Avg Rev/Tenant
          </div>
          <div className="text-2xl font-semibold">{stats.total_tenants > 0 ? fmtMoney(stats.mrr / stats.total_tenants) : '$0'}</div>
        </div>
      </div>

      {/* Tier breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="rounded-lg border p-4" style={{ borderColor: 'var(--border)' }}>
          <div className="text-sm font-medium mb-3">Plan Distribution</div>
          {Object.entries(stats.tier_breakdown).length === 0 ? (
            <div className="text-sm" style={{ color: 'var(--muted-foreground)' }}>No data</div>
          ) : (
            <div className="space-y-2">
              {Object.entries(stats.tier_breakdown)
                .sort(([, a], [, b]) => b - a)
                .map(([tier, count]) => {
                  const pct = stats.total_tenants > 0 ? Math.round((count / stats.total_tenants) * 100) : 0;
                  return (
                    <div key={tier} className="flex items-center gap-3">
                      <div className="w-20 text-sm capitalize">{tier}</div>
                      <div className="flex-1 h-4 rounded overflow-hidden" style={{ backgroundColor: 'var(--muted)' }}>
                        <div
                          className="h-full rounded transition-all"
                          style={{ width: `${pct}%`, backgroundColor: tierColors[tier] || '#6b7280' }}
                        />
                      </div>
                      <div className="text-sm font-medium w-16 text-right">{count}</div>
                      <div className="text-xs w-12 text-right" style={{ color: 'var(--muted-foreground)' }}>{pct}%</div>
                    </div>
                  );
                })}
            </div>
          )}
        </div>

        <div className="rounded-lg border p-4" style={{ borderColor: 'var(--border)' }}>
          <div className="text-sm font-medium mb-3">Usage This Month ({stats.current_month})</div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <div className="text-xs" style={{ color: 'var(--muted-foreground)' }}>Cargo</div>
              <div className="text-lg font-semibold">{fmtCompact(stats.total_usage.cargo_count)}</div>
            </div>
            <div>
              <div className="text-xs" style={{ color: 'var(--muted-foreground)' }}>Documents</div>
              <div className="text-lg font-semibold">{fmtCompact(stats.total_usage.document_count)}</div>
            </div>
            <div>
              <div className="text-xs" style={{ color: 'var(--muted-foreground)' }}>Events</div>
              <div className="text-lg font-semibold">{fmtCompact(stats.total_usage.event_count)}</div>
            </div>
            <div>
              <div className="text-xs" style={{ color: 'var(--muted-foreground)' }}>AI Conversations</div>
              <div className="text-lg font-semibold">{fmtCompact(stats.total_usage.ai_conversation_count)}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Tenant list */}
      <div className="rounded-lg border" style={{ borderColor: 'var(--border)' }}>
        <div className="p-4 border-b text-sm font-medium" style={{ borderColor: 'var(--border)' }}>Tenants</div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ color: 'var(--muted-foreground)' }}>
                <th className="text-left p-3 font-medium">Company</th>
                <th className="text-left p-3 font-medium">Tier</th>
                <th className="text-right p-3 font-medium">Status</th>
                <th className="text-right p-3 font-medium">Usage / Cap</th>
                <th className="text-right p-3 font-medium">Est. Bill</th>
              </tr>
            </thead>
            <tbody className="divide-y" style={{ borderColor: 'var(--border)' }}>
              {tenants.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-4 text-center" style={{ color: 'var(--muted-foreground)' }}>No tenants found.</td>
                </tr>
              ) : (
                tenants.map((t) => (
                  <tr key={t.id}>
                    <td className="p-3 font-medium">{t.company_name}</td>
                    <td className="p-3 capitalize">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        t.pricing_tier === 'enterprise' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
                        t.pricing_tier === 'pro' ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400' :
                        'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400'
                      }`}>
                        {t.pricing_tier}
                      </span>
                    </td>
                    <td className="p-3 text-right">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        t.status === 'active' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                        'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                      }`}>
                        {t.status}
                      </span>
                    </td>
                    <td className="p-3 text-right">
                      {t.shipment_cap != null ? (
                        <span>
                          {t.usage} / {t.shipment_cap}
                          <span className={`ml-1 text-xs ${t.usage_pct != null && t.usage_pct > 80 ? 'text-red-500' : ''}`}>
                            ({t.usage_pct}%)
                          </span>
                        </span>
                      ) : (
                        <span>{t.usage} / &infin;</span>
                      )}
                    </td>
                    <td className="p-3 text-right font-medium">{fmtMoney(t.estimated_bill)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
