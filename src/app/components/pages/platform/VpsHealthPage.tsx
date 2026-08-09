import { useEffect, useState } from 'react';
import { RefreshCw, Cpu, MemoryStick, HardDrive, Server } from 'lucide-react';
import { getMonitorVps, type MonitorVpsResponse } from '@/app/api/monitoring';
import { Card, Loading, ErrorText } from './monitor/ui';

function Bar({ pct, color = '#5e6ad2' }: { pct: number; color?: string }) {
  return (
    <div className="h-2.5 rounded-full" style={{ backgroundColor: 'var(--accent)' }}>
      <div className="h-full rounded-full" style={{ width: `${Math.min(100, pct)}%`, backgroundColor: pct > 90 ? '#ef4444' : pct > 70 ? '#f59e0b' : color }} />
    </div>
  );
}

export default function VpsHealthPage() {
  const [data, setData] = useState<MonitorVpsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    const fetch = async () => {
      try {
        const res = await getMonitorVps();
        if (cancelled) return;
        setData(res);
        setError('');
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : String(e));
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    fetch();
    const interval = setInterval(fetch, 30000);
    return () => { cancelled = true; clearInterval(interval); };
  }, []);

  if (loading) return <Loading />;
  if (error && !data) return <ErrorText>{error}</ErrorText>;

  if (!data?.configured) {
    return (
      <div className="space-y-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">VPS Health</h1>
          <p className="text-muted-foreground text-sm mt-1">Self-hosted OCR / LLM / Hermes services</p>
        </div>
        <Card title="Not configured">
          <p className="text-sm text-muted-foreground py-4">
            The VPS monitor service is not reachable yet. Set the <code className="px-1.5 py-0.5 rounded" style={{ backgroundColor: 'var(--accent)' }}>VPS_MONITOR_BASE_URL</code> worker secret and deploy the monitor-service to the VPS (Phase C).
          </p>
        </Card>
      </div>
    );
  }

  if (!data.ok) {
    return (
      <div className="space-y-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">VPS Health</h1>
          <p className="text-muted-foreground text-sm mt-1">Self-hosted OCR / LLM / Hermes services</p>
        </div>
        <ErrorText>{data.error || 'VPS monitor unreachable'}</ErrorText>
      </div>
    );
  }

  const b = data.body ?? {};
  const services = b.services ?? [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">VPS Health</h1>
          <p className="text-muted-foreground text-sm mt-1">Self-hosted OCR / LLM / Hermes services · {b.hostname || ''} up {b.uptime || ''}</p>
        </div>
        <RefreshCw className="w-5 h-5 text-muted-foreground/60 animate-spin shrink-0" style={{ animationDuration: '3s' }} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card title="CPU" right={<Cpu className="w-4 h-4 text-muted-foreground" />}>
          <div className="text-2xl font-bold tabular-nums">{b.cpu?.percent ?? '—'}%</div>
          <div className="mt-2"><Bar pct={b.cpu?.percent ?? 0} /></div>
          <div className="text-xs text-muted-foreground mt-1">load {b.cpu?.load ?? '—'}</div>
        </Card>
        <Card title="Memory" right={<MemoryStick className="w-4 h-4 text-muted-foreground" />}>
          <div className="text-2xl font-bold tabular-nums">{b.memory?.used_gb ?? '—'}<span className="text-sm text-muted-foreground"> / {b.memory?.total_gb ?? '—'} GB</span></div>
          <div className="mt-2"><Bar pct={b.memory?.percent ?? 0} color="#22c55e" /></div>
        </Card>
        <Card title="Disk" right={<HardDrive className="w-4 h-4 text-muted-foreground" />}>
          <div className="text-2xl font-bold tabular-nums">{b.disk?.used_gb ?? '—'}<span className="text-sm text-muted-foreground"> / {b.disk?.total_gb ?? '—'} GB</span></div>
          <div className="mt-2"><Bar pct={b.disk?.percent ?? 0} color="#22c55e" /></div>
        </Card>
      </div>

      <Card title="Services" subtitle="systemctl is-active state reported by the monitor-service" right={<Server className="w-4 h-4 text-muted-foreground" />}>
        {services.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4 text-center font-medium">No service data</p>
        ) : (
          <div className="space-y-2">
            {services.map((s: any) => (
              <div key={s.name} className="flex items-center justify-between rounded-md px-3 py-2 text-sm" style={{ backgroundColor: 'var(--accent)' }}>
                <span className="font-medium">{s.name}</span>
                <span className="flex items-center gap-2 text-xs">
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: s.active ? '#22c55e' : '#ef4444' }} />
                  <span style={{ color: s.active ? '#22c55e' : '#ef4444', fontWeight: 600 }}>{s.state || (s.active ? 'active' : 'inactive')}</span>
                </span>
              </div>
            ))}
          </div>
        )}
      </Card>

      {b.errors && b.errors.length > 0 && (
        <Card title="Recent service errors" subtitle="Last lines from journalctl">
          <pre className="rounded-md p-3 overflow-x-auto text-[11px] leading-relaxed whitespace-pre-wrap" style={{ backgroundColor: 'var(--accent)' }}>{b.errors.join('\n')}</pre>
        </Card>
      )}
    </div>
  );
}
