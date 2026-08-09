import type { ReactNode } from 'react';

export function timeAgo(iso: string | null | undefined): string {
  if (!iso) return '—';
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return '—';
  const s = Math.max(0, Math.floor((Date.now() - t) / 1000));
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
}

export function formatMs(ms: number | null | undefined): string {
  if (ms === null || ms === undefined || Number.isNaN(ms)) return '—';
  if (ms < 1000) return `${Math.round(ms)}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
  return `${Math.floor(ms / 60000)}m ${Math.round((ms % 60000) / 1000)}s`;
}

export function formatDate(iso: string | null | undefined): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleString();
}

export function Card({ title, subtitle, right, children, className = '' }: {
  title?: string;
  subtitle?: string;
  right?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className="rounded-lg border p-4 space-y-3" style={{ borderColor: 'var(--border)', backgroundColor: 'var(--card)' }}>
      {(title || right) && (
        <div className="flex items-start justify-between gap-3">
          <div>
            {title && <h3 className="text-sm font-semibold">{title}</h3>}
            {subtitle && <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>}
          </div>
          {right}
        </div>
      )}
      <div className={className}>{children}</div>
    </div>
  );
}

const SEVERITY_COLOR: Record<string, string> = {
  error: '#ef4444',
  warn: '#f59e0b',
  info: '#5e6ad2',
};

const STATUS_COLOR: Record<string, string> = {
  queued: '#f59e0b',
  running: '#5e6ad2',
  needs_review: '#eab308',
  completed: '#22c55e',
  failed: '#ef4444',
  done: '#22c55e',
  pending: '#f59e0b',
  processing: '#5e6ad2',
  error: '#ef4444',
  replayed: '#22c55e',
  received: '#5e6ad2',
  processed: '#22c55e',
  active: '#22c55e',
  suspended: '#f59e0b',
  inactive: '#6b7280',
  rejected: '#ef4444',
  accepted: '#22c55e',
  dismissed: '#6b7280',
};

export function StatusBadge({ value }: { value: string | null | undefined }) {
  const v = String(value ?? 'unknown');
  const color = STATUS_COLOR[v.toLowerCase()] ?? '#6b7280';
  return (
    <span
      className="inline-flex items-center gap-1.5 text-[11px] font-semibold px-2 py-0.5 rounded-full uppercase tracking-wide"
      style={{ backgroundColor: `${color}18`, color }}
    >
      <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: color }} />
      {v}
    </span>
  );
}

export function SeverityBadge({ value }: { value: string | null | undefined }) {
  const v = String(value ?? 'info');
  const color = SEVERITY_COLOR[v.toLowerCase()] ?? '#6b7280';
  return (
    <span className="text-[11px] font-semibold px-2 py-0.5 rounded uppercase tracking-wide" style={{ backgroundColor: `${color}18`, color }}>
      {v}
    </span>
  );
}

export function ErrorText({ children }: { children: ReactNode }) {
  return <div className="text-sm font-medium text-red-600 dark:text-red-400">{children}</div>;
}

export function Loading({ label = 'Loading…' }: { label?: string }) {
  return <div className="flex items-center justify-center h-48 text-muted-foreground text-base">{label}</div>;
}
