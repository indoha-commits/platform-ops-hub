import { useState } from 'react';
import { createTenant } from '@/app/api/ops';
import type { CreateTenantResponse } from '@/app/api/ops';

export default function NewTenantPage() {
  const [companyName, setCompanyName] = useState('');
  const [adminEmail, setAdminEmail] = useState('');
  const [product, setProduct] = useState<'indataflow' | 'autoevolve'>('indataflow');
  const [pricingTier, setPricingTier] = useState<'starter' | 'growth' | 'custom'>('starter');
  const [country, setCountry] = useState('');
  const [currency, setCurrency] = useState('USD');
  const [phone, setPhone] = useState('');
  const [managerPhone, setManagerPhone] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<CreateTenantResponse | null>(null);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    setResult(null);
    try {
      const res = await createTenant({
        company_name: companyName,
        admin_email: adminEmail,
        product,
        pricing_tier: pricingTier,
        country: country || undefined,
        currency: currency || undefined,
        phone: phone || undefined,
        manager_phone: managerPhone || undefined,
      });
      setResult(res);
      setCompanyName('');
      setAdminEmail('');
      setPhone('');
      setManagerPhone('');
    } catch (err: any) {
      setError(err?.message || 'Failed to create tenant');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">New Tenant</h1>
        <p className="text-muted-foreground text-sm mt-1">Provision a new tenant directly into active status</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5 rounded-xl border p-6" style={{ borderColor: 'var(--border)' }}>
        <div className="grid gap-5 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="block text-sm font-semibold mb-1.5">Company Name <span className="text-destructive">*</span></label>
            <input type="text" required value={companyName} onChange={e => setCompanyName(e.target.value)}
              placeholder="e.g. Rwanda Logistics Ltd"
              className="w-full rounded-lg border px-3.5 py-2.5 text-sm bg-transparent placeholder:text-muted-foreground/50" style={{ borderColor: 'var(--border)' }} />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-sm font-semibold mb-1.5">Admin Email <span className="text-destructive">*</span></label>
            <input type="email" required value={adminEmail} onChange={e => setAdminEmail(e.target.value)}
              placeholder="admin@company.com"
              className="w-full rounded-lg border px-3.5 py-2.5 text-sm bg-transparent placeholder:text-muted-foreground/50" style={{ borderColor: 'var(--border)' }} />
          </div>
          <div>
            <label className="block text-sm font-semibold mb-1.5">Product</label>
            <select value={product} onChange={e => setProduct(e.target.value as any)}
              className="w-full rounded-lg border px-3.5 py-2.5 text-sm bg-transparent" style={{ borderColor: 'var(--border)' }}>
              <option value="indataflow">InDataFlow</option>
              <option value="autoevolve">AutoEvolve</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold mb-1.5">Pricing Tier</label>
            <select value={pricingTier} onChange={e => setPricingTier(e.target.value as any)}
              className="w-full rounded-lg border px-3.5 py-2.5 text-sm bg-transparent" style={{ borderColor: 'var(--border)' }}>
              <option value="starter">Starter ($250/mo)</option>
              <option value="growth">Growth ($500/mo)</option>
              <option value="custom">Custom</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold mb-1.5">Country</label>
            <input type="text" value={country} onChange={e => setCountry(e.target.value)}
              placeholder="Rwanda"
              className="w-full rounded-lg border px-3.5 py-2.5 text-sm bg-transparent placeholder:text-muted-foreground/50" style={{ borderColor: 'var(--border)' }} />
          </div>
          <div>
            <label className="block text-sm font-semibold mb-1.5">Currency</label>
            <input type="text" value={currency} onChange={e => setCurrency(e.target.value)}
              className="w-full rounded-lg border px-3.5 py-2.5 text-sm bg-transparent placeholder:text-muted-foreground/50" style={{ borderColor: 'var(--border)' }} />
          </div>
          <div>
            <label className="block text-sm font-semibold mb-1.5">Phone (ops notification)</label>
            <input type="tel" value={phone} onChange={e => setPhone(e.target.value)}
              placeholder="+250 788 000 000"
              className="w-full rounded-lg border px-3.5 py-2.5 text-sm bg-transparent placeholder:text-muted-foreground/50" style={{ borderColor: 'var(--border)' }} />
          </div>
          <div>
            <label className="block text-sm font-semibold mb-1.5">Manager Phone (WhatsApp notify)</label>
            <input type="tel" value={managerPhone} onChange={e => setManagerPhone(e.target.value)}
              placeholder="+250 788 000 001"
              className="w-full rounded-lg border px-3.5 py-2.5 text-sm bg-transparent placeholder:text-muted-foreground/50" style={{ borderColor: 'var(--border)' }} />
          </div>
        </div>
        <button type="submit" disabled={submitting}
          className="w-full rounded-lg px-4 py-3 text-sm font-semibold text-white transition-opacity disabled:opacity-50"
          style={{ backgroundColor: '#5e6ad2' }}>
          {submitting ? 'Creating…' : 'Create Tenant'}
        </button>
      </form>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 dark:bg-red-900/20 dark:border-red-800 p-4 text-sm text-red-700 dark:text-red-300 font-medium">
          {error}
        </div>
      )}

      {result && (
        <div className="rounded-xl border p-5 space-y-3" style={{ borderColor: 'var(--border)' }}>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-500" />
            <h3 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground">Tenant Created Successfully</h3>
          </div>
          <div className="grid gap-2 sm:grid-cols-2 text-sm">
            <div className="p-3 rounded-lg" style={{ backgroundColor: 'var(--accent)' }}>
              <div className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Tenant ID</div>
              <div className="font-semibold mt-0.5">{result.tenant_id}</div>
            </div>
            <div className="p-3 rounded-lg" style={{ backgroundColor: 'var(--accent)' }}>
              <div className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Subdomain</div>
              <div className="font-semibold mt-0.5">{result.subdomain}</div>
            </div>
            <div className="p-3 rounded-lg" style={{ backgroundColor: 'var(--accent)' }}>
              <div className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Admin</div>
              <div className="font-semibold mt-0.5">{result.admin_email}</div>
            </div>
            <div className="p-3 rounded-lg" style={{ backgroundColor: 'var(--accent)' }}>
              <div className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Product</div>
              <div className="font-semibold mt-0.5 capitalize">{result.product}</div>
            </div>
          </div>
          {result.login_link && (
            <div className="pt-2">
              <a href={result.login_link} target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-sm font-semibold underline-offset-2 hover:underline"
                style={{ color: '#5e6ad2' }}>
                Open magic login link
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
              </a>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
