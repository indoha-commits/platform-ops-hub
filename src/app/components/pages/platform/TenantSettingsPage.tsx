import { useEffect, useState } from 'react';
import { ArrowLeft, Building2, Loader2, Mail } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { getAdminTenants, resendTenantInvoice, updateAdminTenant } from '@/app/api/ops';
import type { AdminTenantRow, UpdateAdminTenantPayload } from '@/app/api/ops';

type CapKey = 'shipment_cap' | 'whatsapp_cap' | 'ocr_cap' | 'ai_cap';
type RateKey = 'overage_rate' | 'whatsapp_overage_rate' | 'ocr_overage_rate' | 'ai_overage_rate';
type ToggleKey = 'ai_conversation_enabled' | 'jarvis_auto_extract' | 'jarvis_auto_create' | 'doc_analysis_enabled';

const TIER_LABELS: Record<string, string> = {
  starter: 'Starter ($250/mo)',
  growth: 'Growth ($500/mo)',
  custom: 'Custom',
};

const TIER_DEFAULTS: Record<string, { shipment: number | null; whatsapp: number | null; ocr: number | null; ai: number | null }> = {
  starter: { shipment: 30, whatsapp: 500, ocr: 90, ai: 30 },
  growth: { shipment: 100, whatsapp: 2000, ocr: 400, ai: 100 },
  custom: { shipment: null, whatsapp: null, ocr: null, ai: null },
};

const CAP_LABELS: Record<CapKey, string> = {
  shipment_cap: 'Shipment cap (cargo)',
  whatsapp_cap: 'WhatsApp cap (messages)',
  ocr_cap: 'OCR cap (docs)',
  ai_cap: 'AI cap (extractions)',
};

const RATE_LABELS: Record<RateKey, string> = {
  overage_rate: 'Shipment overage rate ($)',
  whatsapp_overage_rate: 'WhatsApp overage rate ($)',
  ocr_overage_rate: 'OCR overage rate ($)',
  ai_overage_rate: 'AI overage rate ($)',
};

const TOGGLE_LABELS: Record<ToggleKey, string> = {
  ai_conversation_enabled: 'AI conversation',
  jarvis_auto_extract: 'Jarvis auto-extract',
  jarvis_auto_create: 'Jarvis auto-create',
  doc_analysis_enabled: 'Document analysis (OCR + LLM)',
};

function Field({
  label,
  value,
  onChange,
  placeholder = '',
  type = 'number',
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
}) {
  return (
    <div>
      <label className="block text-sm font-semibold mb-1.5">{label}</label>
      <input
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border px-3.5 py-2.5 text-sm bg-transparent placeholder:text-muted-foreground/50"
        style={{ borderColor: 'var(--border)' }}
      />
    </div>
  );
}

function Toggle({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className="w-full flex items-center justify-between gap-3 rounded-lg border px-3.5 py-2.5 text-sm"
      style={{ borderColor: 'var(--border)' }}
    >
      <span className="font-medium">{label}</span>
      <span
        className="relative inline-flex h-5 w-9 shrink-0 rounded-full transition-colors"
        style={{ backgroundColor: checked ? '#22c55e' : 'var(--border)' }}
      >
        <span
          className="inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform"
          style={{ marginTop: 2, marginLeft: 2, transform: checked ? 'translateX(16px)' : 'translateX(0)' }}
        />
      </span>
    </button>
  );
}

export default function TenantSettingsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [tenant, setTenant] = useState<AdminTenantRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [sendingInvoice, setSendingInvoice] = useState(false);

  const [tier, setTier] = useState('starter');
  const [status, setStatus] = useState('active');
  const [caps, setCaps] = useState<Record<CapKey, string>>({
    shipment_cap: '', whatsapp_cap: '', ocr_cap: '', ai_cap: '',
  });
  const [rates, setRates] = useState<Record<RateKey, string>>({
    overage_rate: '', whatsapp_overage_rate: '', ocr_overage_rate: '', ai_overage_rate: '',
  });
  const [toggles, setToggles] = useState<Record<ToggleKey, boolean>>({
    ai_conversation_enabled: false,
    jarvis_auto_extract: false,
    jarvis_auto_create: false,
    doc_analysis_enabled: false,
  });

  useEffect(() => {
    let cancelled = false;
    if (!id) { setLoading(false); return; }
    getAdminTenants()
      .then((res) => {
        if (cancelled) return;
        const t = res.tenants.find((x) => x.id === id);
        if (!t) { setLoading(false); return; }
        setTenant(t);
        setTier(t.pricing_tier || 'starter');
        setStatus(t.status || 'active');
        setCaps({
          shipment_cap: t.shipment_cap != null ? String(t.shipment_cap) : '',
          whatsapp_cap: t.whatsapp_cap != null ? String(t.whatsapp_cap) : '',
          ocr_cap: t.ocr_cap != null ? String(t.ocr_cap) : '',
          ai_cap: t.ai_cap != null ? String(t.ai_cap) : '',
        });
        setRates({
          overage_rate: t.overage_rate != null ? String(t.overage_rate) : '',
          whatsapp_overage_rate: t.whatsapp_overage_rate != null ? String(t.whatsapp_overage_rate) : '',
          ocr_overage_rate: t.ocr_overage_rate != null ? String(t.ocr_overage_rate) : '',
          ai_overage_rate: t.ai_overage_rate != null ? String(t.ai_overage_rate) : '',
        });
        setToggles({
          ai_conversation_enabled: Boolean(t.ai_conversation_enabled),
          jarvis_auto_extract: Boolean(t.jarvis_auto_extract),
          jarvis_auto_create: Boolean(t.jarvis_auto_create),
          doc_analysis_enabled: Boolean(t.doc_analysis_enabled),
        });
        setLoading(false);
      })
      .catch((e) => { if (!cancelled) { setError(e?.message || 'Failed to load tenant'); setLoading(false); } });
    return () => { cancelled = true; };
  }, [id]);

  const applyTierDefaults = (nextTier: string) => {
    setTier(nextTier);
    const d = TIER_DEFAULTS[nextTier] ?? TIER_DEFAULTS.custom;
    setCaps({
      shipment_cap: d.shipment != null ? String(d.shipment) : '',
      whatsapp_cap: d.whatsapp != null ? String(d.whatsapp) : '',
      ocr_cap: d.ocr != null ? String(d.ocr) : '',
      ai_cap: d.ai != null ? String(d.ai) : '',
    });
  };

  const handleSave = async () => {
    if (!id) return;
    setSaving(true);
    setError('');
    setSuccess('');
    const payload: UpdateAdminTenantPayload = { pricing_tier: tier, status };
    (Object.keys(caps) as CapKey[]).forEach((k) => {
      const v = caps[k].trim();
      payload[k] = v === '' ? null : Number(v);
    });
    (Object.keys(rates) as RateKey[]).forEach((k) => {
      const v = rates[k].trim();
      payload[k] = v === '' ? null : Number(v);
    });
    (Object.keys(toggles) as ToggleKey[]).forEach((k) => {
      payload[k] = toggles[k];
    });
    try {
      await updateAdminTenant(id, payload);
      setSuccess('Tenant settings saved');
    } catch (e: any) {
      setError(e?.message || 'Failed to save tenant settings');
    } finally {
      setSaving(false);
    }
  };

  const handleResendInvoice = async () => {
    if (!id) return;
    setSendingInvoice(true);
    setError('');
    setSuccess('');
    try {
      const res = await resendTenantInvoice(id);
      setSuccess(`Payment email sent to ${res.sent_to}${res.reused_existing ? ' (reused existing QR/reference)' : ' (created a new setup invoice)'}`);
    } catch (e: any) {
      const msg = e?.message || 'Failed to send payment email';
      setError(msg.includes('email_not_configured')
        ? 'Email provider is not configured on the worker (RESEND_API_KEY missing).'
        : msg);
    } finally {
      setSendingInvoice(false);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64 text-muted-foreground text-base">Loading…</div>;
  }

  if (!tenant) {
    return (
      <div className="space-y-4">
        <button onClick={() => navigate('/tenants')} className="inline-flex items-center gap-1.5 text-sm font-semibold" style={{ color: '#5e6ad2' }}>
          <ArrowLeft className="w-4 h-4" /> Back to tenants
        </button>
        <div className="rounded-xl border p-8 text-center text-muted-foreground text-sm font-medium">Tenant not found</div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <button onClick={() => navigate('/tenants')} className="inline-flex items-center gap-1.5 text-sm font-semibold mb-2" style={{ color: '#5e6ad2' }}>
            <ArrowLeft className="w-4 h-4" /> Back to tenants
          </button>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: '#5e6ad215' }}>
              <Building2 className="w-5 h-5" style={{ color: '#5e6ad2' }} />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">{tenant.company_name}</h1>
              <p className="text-muted-foreground text-sm">{tenant.subdomain || tenant.slug}</p>
            </div>
          </div>
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 dark:bg-red-900/20 dark:border-red-800 p-4 text-sm text-red-700 dark:text-red-300 font-medium">{error}</div>
      )}
      {success && (
        <div className="rounded-lg border border-green-200 bg-green-50 dark:bg-green-900/20 dark:border-green-800 p-4 text-sm text-green-700 dark:text-green-300 font-medium">{success}</div>
      )}

      <div className="grid gap-6 sm:grid-cols-2">
        <div className="rounded-xl border p-5 space-y-4" style={{ borderColor: 'var(--border)' }}>
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Plan</h2>
          <div>
            <label className="block text-sm font-semibold mb-1.5">Pricing tier</label>
            <select
              value={tier}
              onChange={(e) => applyTierDefaults(e.target.value)}
              className="w-full rounded-lg border px-3.5 py-2.5 text-sm bg-transparent"
              style={{ borderColor: 'var(--border)' }}
            >
              {Object.entries(TIER_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
            <p className="text-xs text-muted-foreground mt-1.5">Switching tier pre-fills default caps — adjust below if needed.</p>
          </div>
          <div>
            <label className="block text-sm font-semibold mb-1.5">Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full rounded-lg border px-3.5 py-2.5 text-sm bg-transparent"
              style={{ borderColor: 'var(--border)' }}
            >
              {['active', 'suspended', 'pending_payment', 'inactive'].map((s) => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
            </select>
          </div>
          {status === 'pending_payment' && (
            <button
              type="button"
              onClick={handleResendInvoice}
              disabled={sendingInvoice}
              className="w-full inline-flex items-center justify-center gap-2 rounded-lg border px-3.5 py-2.5 text-sm font-semibold transition-colors disabled:opacity-50"
              style={{ borderColor: 'var(--border)' }}
            >
              {sendingInvoice ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Sending payment email…</>
              ) : (
                <><Mail className="w-4 h-4" /> Send payment email</>
              )}
            </button>
          )}
        </div>

        <div className="rounded-xl border p-5 space-y-4" style={{ borderColor: 'var(--border)' }}>
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Feature access</h2>
          {(
            Object.keys(TOGGLE_LABELS) as ToggleKey[]
          ).map((k) => (
            <Toggle key={k} label={TOGGLE_LABELS[k]} checked={toggles[k]} onChange={(v) => setToggles((s) => ({ ...s, [k]: v }))} />
          ))}
        </div>
      </div>

      <div className="rounded-xl border p-5 space-y-5" style={{ borderColor: 'var(--border)' }}>
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Caps & overage</h2>
        <div className="grid gap-5 sm:grid-cols-2">
          {(Object.keys(CAP_LABELS) as CapKey[]).map((k) => (
            <Field key={k} label={CAP_LABELS[k]} value={caps[k]} placeholder="Leave empty = unlimited" onChange={(v) => setCaps((s) => ({ ...s, [k]: v }))} />
          ))}
        </div>
        <div className="grid gap-5 sm:grid-cols-2">
          {(Object.keys(RATE_LABELS) as RateKey[]).map((k) => (
            <Field key={k} label={RATE_LABELS[k]} value={rates[k]} placeholder="Leave empty = tier default" onChange={(v) => setRates((s) => ({ ...s, [k]: v }))} />
          ))}
        </div>
      </div>

      <button
        type="button"
        onClick={handleSave}
        disabled={saving}
        className="w-full sm:w-auto rounded-lg px-6 py-3 text-sm font-semibold text-white transition-opacity disabled:opacity-50"
        style={{ backgroundColor: '#5e6ad2' }}
      >
        {saving ? (
          <span className="inline-flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> Saving…</span>
        ) : 'Save settings'}
      </button>
    </div>
  );
}
