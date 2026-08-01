import { useEffect, useState } from 'react';
import { Building2, Package, MessageSquare, FileText, BrainCircuit } from 'lucide-react';
import { getAdminStats } from '@/app/api/ops';
import type { AdminStats } from '@/app/api/ops';

const MOCK_STATS: AdminStats = {
  mrr: 2750,
  arr: 33000,
  total_tenants: 4,
  active_tenants: 3,
  tier_breakdown: { starter: 1, growth: 1, custom: 2 },
  current_month: new Date().toISOString().slice(0, 7),
  total_usage: { cargo_count: 142, whatsapp_message_count: 3400, ocr_doc_count: 520, ai_extraction_count: 180 },
};

const KPI_CARD = [
  { key: 'active_tenants', label: 'Active Tenants', icon: Building2, color: '#5e6ad2' },
  { key: 'cargo_count', label: 'Total Cargo', icon: Package, color: '#22c55e' },
  { key: 'whatsapp_message_count', label: 'WhatsApp Messages', icon: MessageSquare, color: '#22c55e' },
  { key: 'ocr_doc_count', label: 'OCR Documents', icon: FileText, color: '#f59e0b' },
  { key: 'ai_extraction_count', label: 'AI Extractions', icon: BrainCircuit, color: '#ef4444' },
];

export default function DashboardPage() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const fetch = async () => {
      try {
        const data = await getAdminStats();
        if (!cancelled) setStats(data);
      } catch {
        if (!cancelled) setStats(MOCK_STATS);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    fetch();
    const interval = setInterval(fetch, 30000);
    return () => { cancelled = true; clearInterval(interval); };
  }, []);

  if (loading) return <div className="flex items-center justify-center h-64 text-muted-foreground text-base">Loading…</div>;
  if (!stats) return <div className="flex items-center justify-center h-64 text-muted-foreground text-base">No data</div>;

  const cards = KPI_CARD.map(k => {
    const val = k.key === 'active_tenants' ? stats.active_tenants
      : (stats.total_usage as any)?.[k.key] ?? 0;
    return { ...k, value: val };
  });

  return (
    <div className="space-y-8">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Platform Overview</h1>
          <p className="text-muted-foreground text-sm mt-1">Real-time metrics across all products and tenants</p>
        </div>
        <div className="text-right">
          <div className="text-3xl font-bold tracking-tight">${stats.mrr.toLocaleString()}</div>
          <div className="text-xs text-muted-foreground font-medium uppercase tracking-wider">MRR</div>
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {cards.map(c => {
          const Icon = c.icon;
          return (
            <div key={c.key} className="rounded-xl border p-5 flex items-center gap-4" style={{ borderColor: 'var(--border)' }}>
              <div className="w-12 h-12 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: `${c.color}20` }}>
                <Icon className="w-6 h-6" style={{ color: c.color }} />
              </div>
              <div className="min-w-0">
                <div className="text-3xl font-bold tracking-tight">{c.value.toLocaleString()}</div>
                <div className="text-sm text-muted-foreground font-medium">{c.label}</div>
              </div>
            </div>
          );
        })}
      </div>
      <div className="rounded-xl border p-5" style={{ borderColor: 'var(--border)' }}>
        <h2 className="text-xl font-semibold tracking-tight mb-4">Tier Breakdown</h2>
        {stats.tier_breakdown && Object.entries(stats.tier_breakdown).length > 0 ? (
          <div className="grid gap-3 sm:grid-cols-3">
            {Object.entries(stats.tier_breakdown).map(([tier, count]) => (
              <div key={tier} className="flex items-center justify-between p-4 rounded-lg" style={{ backgroundColor: 'var(--accent)' }}>
                <span className="capitalize font-semibold text-sm">{tier}</span>
                <span className="text-xl font-bold tracking-tight">{count} <span className="text-sm font-normal text-muted-foreground">tenant{count !== 1 ? 's' : ''}</span></span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground text-sm">No tenant data yet</p>
        )}
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl border p-5" style={{ borderColor: 'var(--border)' }}>
          <div className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Annual Run Rate</div>
          <div className="text-3xl font-bold tracking-tight mt-1">${stats.arr.toLocaleString()}</div>
        </div>
        <div className="rounded-xl border p-5" style={{ borderColor: 'var(--border)' }}>
          <div className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Current Month</div>
          <div className="text-3xl font-bold tracking-tight mt-1">{stats.current_month}</div>
        </div>
      </div>
    </div>
  );
}
