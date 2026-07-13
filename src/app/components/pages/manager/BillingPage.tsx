import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CreditCard, Loader2, AlertTriangle, Check, ChevronDown, ChevronUp } from 'lucide-react';
import { getManagerBilling, changeManagerTier, type BillingInfo } from '@/app/api/ops';
import { PageHeader } from '@/app/components/PageHeader';

const TIER_LABELS: Record<string, string> = { basic: 'Basic', pro: 'Pro', enterprise: 'Enterprise' };
const TIER_PRICES: Record<string, number> = { basic: 300, pro: 800, enterprise: 2000 };
const TIER_CAPS: Record<string, number | null> = { basic: 30, pro: 150, enterprise: null };
const TIER_OVERAGE: Record<string, number | null> = { basic: 10, pro: 8, enterprise: null };

function fmtMoney(n: number) {
  return '$' + (Number.isFinite(n) ? n.toLocaleString('en-US') : '0');
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

export function BillingPage() {
  const navigate = useNavigate();
  const [data, setData] = useState<BillingInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [upgrading, setUpgrading] = useState(false);
  const [showConfirm, setShowConfirm] = useState<string | null>(null);
  const [showInvoices, setShowInvoices] = useState(false);

  useEffect(() => {
    setLoading(true);
    getManagerBilling()
      .then(setData)
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const handleChangeTier = async (tier: string) => {
    setUpgrading(true);
    setError('');
    try {
      const result = await changeManagerTier(tier);
      if ((result as any).ok) {
        setShowConfirm(null);
        // Refresh
        const fresh = await getManagerBilling();
        setData(fresh);
      }
    } catch (e: any) {
      setError(e.message || 'Failed to change tier');
    } finally {
      setUpgrading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="p-6">
        <PageHeader title="Billing" icon={CreditCard} />
        <div className="mt-4 p-4 rounded bg-destructive/10 text-destructive text-sm">
          {error || 'Could not load billing information.'}
        </div>
      </div>
    );
  }

  const tier = data.pricing.tier;
  const usage = data.currentUsage.cargo_count || 0;
  const cap = data.pricing.cap;
  const overageRate = data.pricing.overageRate;
  const pct = cap && cap > 0 ? Math.min(100, Math.round((usage / cap) * 100)) : 0;
  const overage = cap && overageRate ? Math.max(0, usage - cap) * overageRate : 0;
  const total = TIER_PRICES[tier] ?? 300 + overage;

  return (
    <div className="p-6 max-w-4xl">
      <PageHeader title="Billing & Plan" icon={CreditCard} />

      {error && (
        <div className="mb-4 p-3 rounded bg-destructive/10 text-destructive text-sm flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8 mt-6">
        <div className="rounded-lg border p-5" style={{ borderColor: 'var(--border)' }}>
          <div className="text-xs uppercase tracking-wider mb-1" style={{ color: 'var(--muted-foreground)' }}>Current Plan</div>
          <div className="text-2xl font-semibold">{TIER_LABELS[tier] || tier}</div>
          <div className="text-sm mt-1" style={{ color: 'var(--muted-foreground)' }}>{fmtMoney(TIER_PRICES[tier] ?? 0)}/mo</div>
        </div>
        <div className="rounded-lg border p-5" style={{ borderColor: 'var(--border)' }}>
          <div className="text-xs uppercase tracking-wider mb-1" style={{ color: 'var(--muted-foreground)' }}>Usage This Month</div>
          <div className="text-2xl font-semibold">{usage} cargo</div>
          {cap && (
            <div className="mt-2">
              <div className="w-full h-2 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--muted)' }}>
                <div
                  className="h-full rounded-full transition-all"
                  style={{ width: `${pct}%`, backgroundColor: pct > 80 ? '#d4183d' : '#5e6ad2' }}
                />
              </div>
              <div className="text-xs mt-1" style={{ color: 'var(--muted-foreground)' }}>
                {usage} / {cap} ({pct}%) {usage > cap ? `— ${fmtMoney(overage)} overage` : ''}
              </div>
            </div>
          )}
          {!cap && <div className="text-xs mt-1" style={{ color: 'var(--muted-foreground)' }}>Unlimited</div>}
        </div>
        <div className="rounded-lg border p-5" style={{ borderColor: 'var(--border)' }}>
          <div className="text-xs uppercase tracking-wider mb-1" style={{ color: 'var(--muted-foreground)' }}>Estimated Total</div>
          <div className="text-2xl font-semibold">{fmtMoney(total)}</div>
          <div className="text-xs mt-1" style={{ color: 'var(--muted-foreground)' }}>
            {overage > 0
              ? `Base ${fmtMoney(TIER_PRICES[tier] ?? 0)} + ${fmtMoney(overage)} overage`
              : `Base ${fmtMoney(TIER_PRICES[tier] ?? 0)} (no overage)`}
          </div>
        </div>
      </div>

      {/* Change plan section */}
      <div className="rounded-lg border mb-6" style={{ borderColor: 'var(--border)' }}>
        <div className="p-4 border-b text-sm font-medium" style={{ borderColor: 'var(--border)' }}>Change Plan</div>
        <div className="divide-y" style={{ borderColor: 'var(--border)' }}>
          {['basic', 'pro', 'enterprise'].map((t) => {
            const isCurrent = t === tier;
            const isDowngrade = TIER_PRICES[t] < TIER_PRICES[tier];
            return (
              <div key={t} className="p-4 flex items-center justify-between">
                <div>
                  <div className="font-medium">{TIER_LABELS[t]}</div>
                  <div className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
                    {fmtMoney(TIER_PRICES[t])}/mo — {TIER_CAPS[t] ? `${TIER_CAPS[t]} cargo/mo, $${TIER_OVERAGE[t]}/extra` : 'Unlimited cargo'}
                  </div>
                </div>
                {isCurrent ? (
                  <span className="text-xs px-3 py-1 rounded-full bg-primary/10 text-primary font-medium">Current</span>
                ) : showConfirm === t ? (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleChangeTier(t)}
                      disabled={upgrading}
                      className="px-3 py-1.5 rounded text-xs font-medium text-white disabled:opacity-50"
                      style={{ backgroundColor: isDowngrade ? '#d4183d' : '#5e6ad2' }}
                    >
                      {upgrading ? 'Updating...' : `Confirm ${isDowngrade ? 'Downgrade' : 'Upgrade'}`}
                    </button>
                    <button onClick={() => setShowConfirm(null)} className="px-3 py-1.5 rounded text-xs border" style={{ borderColor: 'var(--border)' }}>
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setShowConfirm(t)}
                    className="px-3 py-1.5 rounded text-xs font-medium border"
                    style={{ borderColor: 'var(--border)' }}
                  >
                    {isDowngrade ? 'Downgrade' : 'Upgrade'}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Invoices */}
      <div className="rounded-lg border mb-6" style={{ borderColor: 'var(--border)' }}>
        <button
          onClick={() => setShowInvoices(!showInvoices)}
          className="w-full p-4 flex items-center justify-between text-sm font-medium"
        >
          Invoice History
          {showInvoices ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
        {showInvoices && (
          <div className="divide-y" style={{ borderColor: 'var(--border)' }}>
            {data.invoices.length === 0 ? (
              <div className="p-4 text-sm" style={{ color: 'var(--muted-foreground)' }}>No invoices yet.</div>
            ) : (
              data.invoices.map((inv) => (
                <div key={inv.id} className="p-4 flex items-center justify-between text-sm">
                  <div>
                    <span className="font-medium">{inv.invoice_number}</span>
                    <span className="ml-3" style={{ color: 'var(--muted-foreground)' }}>{fmtDate(inv.issued_at)}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={inv.status === 'paid' ? 'text-green-600' : ''}>
                      {fmtMoney(inv.amount)}
                    </span>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      inv.status === 'paid'
                        ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                        : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                    }`}>
                      {inv.status}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
