import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { convertAdminLead, getAdminLeads, type AdminLeadRow } from '@/app/api/ops';

type LeadFilter = 'new' | 'converted' | 'all';

function StatusPill({ status }: { status: string }) {
  const tone =
    status === 'converted'
      ? 'bg-green-500/10 text-green-700 dark:text-green-300'
      : status === 'dismissed'
        ? 'bg-gray-500/10 text-gray-600 dark:text-gray-300'
        : 'bg-amber-500/10 text-amber-700 dark:text-amber-300';
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium capitalize ${tone}`}>
      {status}
    </span>
  );
}

export default function LeadsPage() {
  const [leads, setLeads] = useState<AdminLeadRow[]>([]);
  const [filter, setFilter] = useState<LeadFilter>('new');
  const [loading, setLoading] = useState(true);
  const [convertingId, setConvertingId] = useState<string | null>(null);

  const load = useCallback(async (f: LeadFilter) => {
    setLoading(true);
    try {
      const res = await getAdminLeads(f === 'all' ? 'all' : f);
      setLeads(res.leads);
    } catch (e: any) {
      toast.error(e?.message || 'Failed to load leads');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load(filter);
  }, [filter, load]);

  const handleConvert = async (lead: AdminLeadRow) => {
    if (!window.confirm(`Convert "${lead.company || lead.name}" into a tenant and send the setup invoice to ${lead.email}?`)) return;
    setConvertingId(lead.id);
    try {
      const res = await convertAdminLead(lead.id, lead.pricing_tier ?? 'starter');
      toast.success(`Converted ${res.subdomain}. Setup invoice + MoMo email sent.`);
      await load(filter);
    } catch (e: any) {
      toast.error(e?.message || 'Conversion failed');
    } finally {
      setConvertingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Leads</h1>
          <p className="text-muted-foreground text-sm mt-1">Signup-card submissions → convert into a tenant with a MoMo setup invoice</p>
        </div>
        <div className="flex gap-1 rounded-lg border p-1" style={{ borderColor: 'var(--border)' }}>
          {(['new', 'converted', 'all'] as LeadFilter[]).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${filter === f ? 'text-white' : 'text-muted-foreground hover:text-foreground'}`}
              style={filter === f ? { backgroundColor: '#5e6ad2' } : {}}
            >
              {f === 'all' ? 'All' : f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-xl border overflow-hidden" style={{ borderColor: 'var(--border)' }}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b" style={{ borderColor: 'var(--border)' }}>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground text-left">Lead</th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground text-left">Contact</th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground text-left">Monthly volume</th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground text-left">Plan</th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground text-left">Source</th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground text-left">Status</th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} className="px-4 py-12 text-center text-muted-foreground text-sm">Loading…</td></tr>
              ) : leads.length === 0 ? (
                <tr><td colSpan={7} className="px-4 py-12 text-center text-muted-foreground text-sm">No leads found</td></tr>
              ) : (
                leads.map((lead) => (
                  <tr key={lead.id} className="border-t" style={{ borderColor: 'var(--border)' }}>
                    <td className="px-4 py-3.5">
                      <div className="font-semibold">{lead.name}</div>
                      <div className="text-xs text-muted-foreground font-medium">{lead.company}</div>
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="text-sm">{lead.email}</div>
                      <div className="text-xs text-muted-foreground">{lead.phone || lead.country || '—'}</div>
                    </td>
                    <td className="px-4 py-3.5 text-sm">{lead.monthly_volume || '—'}</td>
                    <td className="px-4 py-3.5">
                      {lead.pricing_tier ? (
                        <span
                          className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium capitalize"
                          style={{ backgroundColor: 'rgba(94, 106, 210, 0.15)', color: '#5e6ad2' }}
                        >
                          {lead.pricing_tier}
                        </span>
                      ) : (
                        <span className="text-muted-foreground text-sm">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3.5 text-sm text-muted-foreground">{lead.source || lead.source_page || '—'}</td>
                    <td className="px-4 py-3.5">
                      <StatusPill status={lead.status} />
                      {lead.converted_tenant_name && (
                        <div className="text-xs text-muted-foreground mt-1">
                          → {lead.converted_tenant_name}
                          {lead.converted_tenant_subdomain ? ` (${lead.converted_tenant_subdomain})` : ''}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      {lead.status === 'converted' ? (
                        <span className="text-xs text-muted-foreground">Converted</span>
                      ) : (
                        <button
                          onClick={() => handleConvert(lead)}
                          disabled={convertingId === lead.id}
                          className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-semibold text-white transition-opacity disabled:opacity-50"
                          style={{ backgroundColor: '#5e6ad2' }}
                        >
                          {convertingId === lead.id ? 'Converting…' : 'Convert'}
                        </button>
                      )}
                    </td>
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