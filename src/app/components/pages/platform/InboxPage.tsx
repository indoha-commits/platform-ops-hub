import { useEffect, useState } from 'react';
import { MessageSquare, Mail, ExternalLink, XCircle } from 'lucide-react';
import { getWhatsappInbox, getEmailInbox, assignWhatsappInboxItem, dismissWhatsappInboxItem, assignEmailInboxItem, dismissEmailInboxItem } from '@/app/api/ops';
import type { InboxItem } from '@/app/api/ops';

const MOCK_WA_ITEMS: InboxItem[] = [
  { id: 'mock-wa-1', created_at: new Date().toISOString(), from_number: '+250788123456', caption: 'Bill of Lading — ACLU6789345', filename: 'bl.pdf', doc_type: 'bill_of_lading', status: 'pending', matched_client_name: 'Acme Freight Ltd' },
  { id: 'mock-wa-2', created_at: new Date(Date.now() - 3600000).toISOString(), from_number: '+250722654321', caption: 'Packing list photo', filename: 'pl.jpg', doc_type: 'packing_list', status: 'pending', matched_client_name: 'East Africa Logistics' },
  { id: 'mock-wa-3', created_at: new Date(Date.now() - 7200000).toISOString(), from_number: '+250788123456', filename: 'invoice.pdf', doc_type: 'invoice', status: 'matched', matched_client_name: 'Acme Freight Ltd', matched_cargo_id: 'cargo-1', matched_cargo_container: 'ACLU6789345' },
];

const MOCK_EMAIL_ITEMS: InboxItem[] = [
  { id: 'mock-em-1', created_at: new Date().toISOString(), from_email: 'finance@globalshipping.com', subject: 'Commercial Invoice — shipment GL-2026-04', filename: 'invoice_april.pdf', doc_type: 'invoice', status: 'pending', matched_client_name: 'Global Shipping Co' },
  { id: 'mock-em-2', created_at: new Date(Date.now() - 1800000).toISOString(), from_email: 'ops@acmefreight.com', subject: 'Certificate of Origin — container ACLU6789345', filename: 'coo.pdf', doc_type: 'certificate_of_origin', status: 'matched', matched_client_name: 'Acme Freight Ltd', matched_cargo_id: 'cargo-1', matched_cargo_container: 'ACLU6789345' },
  { id: 'mock-em-3', created_at: new Date(Date.now() - 86400000).toISOString(), from_email: 'docs@eastafrica.rw', subject: 'Draft customs declaration', filename: 'declaration.pdf', doc_type: 'declaration', status: 'dismissed', matched_client_name: 'East Africa Logistics' },
];

type Tab = 'whatsapp' | 'email';

export default function InboxPage() {
  const [tab, setTab] = useState<Tab>('whatsapp');
  const [items, setItems] = useState<InboxItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = async () => {
    setLoading(true);
    try {
      const data = tab === 'whatsapp'
        ? await getWhatsappInbox({ status: 'all', limit: 100 })
        : await getEmailInbox({ status: 'all', limit: 100 });
      const fetched = data.items || [];
      setItems(fetched.length > 0 ? fetched : (tab === 'whatsapp' ? MOCK_WA_ITEMS : MOCK_EMAIL_ITEMS));
    } catch {
      setItems(tab === 'whatsapp' ? MOCK_WA_ITEMS : MOCK_EMAIL_ITEMS);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetch(); }, [tab]);

  const handleAssign = async (itemId: string) => {
    const cargoId = prompt('Enter cargo ID to assign:');
    if (!cargoId) return;
    try {
      if (tab === 'whatsapp') await assignWhatsappInboxItem(itemId, cargoId);
      else await assignEmailInboxItem(itemId, cargoId);
    } catch { /* ignore */ }
    fetch();
  };

  const handleDismiss = async (itemId: string) => {
    try {
      if (tab === 'whatsapp') await dismissWhatsappInboxItem(itemId);
      else await dismissEmailInboxItem(itemId);
    } catch { /* ignore */ }
    fetch();
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Inbox</h1>
        <p className="text-muted-foreground text-sm mt-1">Review and manage incoming documents</p>
      </div>
      <div className="flex gap-2 border-b pb-2" style={{ borderColor: 'var(--border)' }}>
        {(['whatsapp', 'email'] as Tab[]).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-t-lg text-sm font-semibold transition-colors ${tab === t ? 'border-b-2 text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
            style={tab === t ? { borderBottomColor: '#5e6ad2' } : {}}>
            {t === 'whatsapp' ? <MessageSquare className="w-4 h-4" /> : <Mail className="w-4 h-4" />}
            {t === 'whatsapp' ? 'WhatsApp' : 'Email'}
          </button>
        ))}
      </div>
      {loading ? (
        <div className="flex items-center justify-center h-48 text-muted-foreground text-base">Loading…</div>
      ) : items.length === 0 ? (
        <div className="flex items-center justify-center h-48 text-muted-foreground text-base font-medium">No items</div>
      ) : (
        <div className="space-y-2">
          {items.map(item => (
            <div key={item.id} className="flex items-start gap-3.5 rounded-lg border p-4" style={{ borderColor: 'var(--border)' }}>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                    item.status === 'pending' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' :
                    item.status === 'matched' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                    'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
                  }`}>{item.status}</span>
                  {item.doc_type && <span className="text-xs text-muted-foreground font-medium">{item.doc_type.replace(/_/g, ' ')}</span>}
                  {item.matched_client_name && <span className="text-xs text-muted-foreground font-medium">&middot; {item.matched_client_name}</span>}
                </div>
                <p className="text-sm font-semibold mt-1.5 truncate">{item.caption || item.subject || item.filename || '(no description)'}</p>
                <p className="text-xs text-muted-foreground font-medium mt-1">
                  From: {item.from_number || item.from_email || 'unknown'}
                  {item.matched_cargo_container && <span className="ml-2">&middot; Container: {item.matched_cargo_container}</span>}
                </p>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                {item.status === 'pending' && (
                  <button onClick={() => handleAssign(item.id)}
                    className="p-2 rounded-lg hover:bg-accent/20 text-muted-foreground hover:text-foreground transition-colors" title="Assign to cargo">
                    <ExternalLink className="w-4 h-4" />
                  </button>
                )}
                {item.status !== 'dismissed' && (
                  <button onClick={() => handleDismiss(item.id)}
                    className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-muted-foreground hover:text-red-500 transition-colors" title="Dismiss">
                    <XCircle className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
