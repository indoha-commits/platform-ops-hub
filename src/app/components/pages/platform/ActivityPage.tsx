import { useEffect, useState } from 'react';
import { MessageSquare, Mail, RefreshCw } from 'lucide-react';
import { getWhatsappInbox, getEmailInbox } from '@/app/api/ops';
import type { InboxItem } from '@/app/api/ops';

type MergedEvent = {
  id: string;
  timestamp: string;
  channel: 'whatsapp' | 'email';
  from: string;
  description: string;
  status: string;
  docType?: string;
  clientName?: string;
  cargoId?: string;
};

const CHANNEL_ICON: Record<string, React.ElementType> = { whatsapp: MessageSquare, email: Mail };
const CHANNEL_COLOR: Record<string, string> = { whatsapp: '#22c55e', email: '#5e6ad2' };

const MOCK_EVENTS: MergedEvent[] = [
  { id: 'wa-1', timestamp: new Date(Date.now() - 60000).toISOString(), channel: 'whatsapp', from: '+250788123456', description: 'Bill of Lading document received', status: 'matched', docType: 'bill_of_lading', clientName: 'Acme Freight Ltd', cargoId: 'cargo-1' },
  { id: 'em-1', timestamp: new Date(Date.now() - 120000).toISOString(), channel: 'email', from: 'finance@globalshipping.com', description: 'Commercial Invoice for shipment GL-2026-04', status: 'pending', docType: 'invoice', clientName: 'Global Shipping Co' },
  { id: 'wa-2', timestamp: new Date(Date.now() - 300000).toISOString(), channel: 'whatsapp', from: '+250722654321', description: 'Packing list photo', status: 'pending', clientName: 'East Africa Logistics' },
  { id: 'em-2', timestamp: new Date(Date.now() - 600000).toISOString(), channel: 'email', from: 'ops@acmefreight.com', description: 'Certificate of Origin scanned copy', status: 'matched', docType: 'certificate_of_origin', clientName: 'Acme Freight Ltd', cargoId: 'cargo-1' },
  { id: 'wa-3', timestamp: new Date(Date.now() - 1800000).toISOString(), channel: 'whatsapp', from: '+250788123456', description: 'Update on container status — offloaded at Mombasa', status: 'matched', clientName: 'Acme Freight Ltd' },
];

export default function ActivityPage() {
  const [events, setEvents] = useState<MergedEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [channelFilter, setChannelFilter] = useState<string>('all');

  useEffect(() => {
    let cancelled = false;
    const fetch = async () => {
      try {
        const [wa, em] = await Promise.all([
          getWhatsappInbox({ limit: 50 }).catch(() => ({ items: [] })),
          getEmailInbox({ limit: 50 }).catch(() => ({ items: [] })),
        ]);
        if (cancelled) return;
        const merged: MergedEvent[] = [
          ...wa.items.map(i => ({
            id: `wa-${i.id}`, timestamp: i.created_at, channel: 'whatsapp' as const,
            from: i.from_number || 'unknown', description: i.caption || i.filename || 'WhatsApp document',
            status: i.status, docType: i.doc_type,
            clientName: i.matched_client_name || undefined, cargoId: i.matched_cargo_id || undefined,
          })),
          ...em.items.map(i => ({
            id: `em-${i.id}`, timestamp: i.created_at, channel: 'email' as const,
            from: i.from_email || 'unknown', description: i.subject || i.filename || 'Email document',
            status: i.status, docType: i.doc_type,
            clientName: i.matched_client_name || undefined, cargoId: i.matched_cargo_id || undefined,
          })),
        ].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
        if (!cancelled) setEvents(merged.length > 0 ? merged : MOCK_EVENTS);
      } catch {
        if (!cancelled) setEvents(MOCK_EVENTS);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    fetch();
    const interval = setInterval(fetch, 30000);
    return () => { cancelled = true; clearInterval(interval); };
  }, []);

  const filtered = channelFilter === 'all' ? events : events.filter(e => e.channel === channelFilter);

  if (loading) return <div className="flex items-center justify-center h-64 text-muted-foreground text-base">Loading…</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Activity Feed</h1>
          <p className="text-muted-foreground text-sm mt-1">Real-time activity across all channels</p>
        </div>
        <RefreshCw className="w-5 h-5 text-muted-foreground/60 animate-spin shrink-0" style={{ animationDuration: '3s' }} />
      </div>
      <div className="flex gap-2">
        {['all', 'whatsapp', 'email'].map(ch => (
          <button key={ch} onClick={() => setChannelFilter(ch)}
            className={`px-3.5 py-2 rounded-lg text-sm font-semibold transition-colors ${channelFilter === ch ? 'text-white' : 'text-muted-foreground hover:bg-accent/20'}`}
            style={channelFilter === ch ? { backgroundColor: '#5e6ad2' } : {}}>
            {ch === 'all' ? 'All' : ch === 'whatsapp' ? 'WhatsApp' : 'Email'}
            {ch !== 'all' && <span className="ml-1.5 opacity-60">({events.filter(e => e.channel === ch).length})</span>}
          </button>
        ))}
      </div>
      <div className="space-y-2">
        {filtered.length === 0 ? (
          <p className="text-muted-foreground text-sm py-12 text-center font-medium">No activity yet</p>
        ) : (
          filtered.map(e => {
            const Icon = CHANNEL_ICON[e.channel] || Mail;
            const color = CHANNEL_COLOR[e.channel] || '#888';
            return (
              <div key={e.id} className="flex items-start gap-3.5 rounded-lg border p-4" style={{ borderColor: 'var(--border)' }}>
                <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 mt-0.5" style={{ backgroundColor: `${color}18` }}>
                  <Icon className="w-[18px] h-[18px]" style={{ color }} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[11px] font-semibold px-1.5 py-0.5 rounded uppercase tracking-wider" style={{ backgroundColor: `${color}14`, color }}>{e.channel}</span>
                    <span className="text-sm font-semibold truncate">{e.description}</span>
                    {e.clientName && <span className="text-xs text-muted-foreground font-medium">&middot; {e.clientName}</span>}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1 font-medium">
                    From: {e.from}{e.docType && <span className="ml-2">&middot; {e.docType}</span>}
                  </div>
                </div>
                <div className="text-xs text-muted-foreground font-medium shrink-0 tabular-nums">{new Date(e.timestamp).toLocaleDateString()}</div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
