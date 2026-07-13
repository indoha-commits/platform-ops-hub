import { useEffect, useMemo, useState } from 'react';
import { Menu } from 'lucide-react';
import { Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import { Sidebar } from '@/app/components/Sidebar';
import { OpsSidebarContent } from '@/app/components/OpsSidebarContent';
import { getSupabase } from '@/app/auth/supabase';
import { Sheet, SheetContent } from '@/app/components/ui/sheet';
import { ActionPanelPage } from '@/app/components/pages/manager/ActionPanelPage';
import { PipelinePage } from '@/app/components/pages/manager/PipelinePage';
import { MonitoringPage } from '@/app/components/pages/manager/MonitoringPage';
import { RiskCenterPage } from '@/app/components/pages/manager/RiskCenterPage';
import { ShipmentsPage } from '@/app/components/pages/manager/ShipmentsPage';
import { BillingPage } from '@/app/components/pages/manager/BillingPage';
import { AdminDashboardPage } from '@/app/components/pages/manager/AdminDashboardPage';
import { PaymentsPage } from '@/app/components/pages/manager/PaymentsPage';
import { ReceivablesPage } from '@/app/components/pages/manager/ReceivablesPage';

type ManagerPageId =
  | 'shipments'
  | 'payments'
  | 'receivables'
  | 'action-panel'
  | 'pipeline'
  | 'monitoring'
  | 'risk-center'
  | 'billing'
  | 'admin';

const pageToPath: Record<ManagerPageId, string> = {
  shipments: 'shipments',
  payments: 'payments',
  receivables: 'receivables',
  'action-panel': 'action-panel',
  pipeline: 'pipeline',
  monitoring: 'monitoring',
  'risk-center': 'risk-center',
  billing: 'billing',
  admin: 'admin',
};

const pathToPage: Record<string, ManagerPageId> = {
  shipments: 'shipments',
  payments: 'payments',
  receivables: 'receivables',
  'action-panel': 'action-panel',
  pipeline: 'pipeline',
  monitoring: 'monitoring',
  'risk-center': 'risk-center',
  billing: 'billing',
  admin: 'admin',
};

function requireEnv(name: string): string {
  const v = (import.meta.env as any)[name] as string | undefined;
  if (!v) throw new Error(`Missing required env var: ${name}`);
  return v;
}

const authPortalUrl = requireEnv('VITE_AUTH_PORTAL_URL');

function useManagerRouteState() {
  const navigate = useNavigate();
  const location = useLocation();

  const pageSlug = location.pathname.replace(/^\//, '');
  const normalizedPage = pageSlug && pageSlug in pathToPage ? (pageSlug as ManagerPageId) : 'action-panel';
  const currentPage = pathToPage[normalizedPage] ?? 'action-panel';

  const setCurrentPage = (page: ManagerPageId) => {
    const pagePath = pageToPath[page];
    const target = `/${pagePath}`.replace(/\/+$/, '') || '/';
    if (target === location.pathname) return;
    navigate(target);
  };

  return { currentPage, setCurrentPage };
}

function ManagerPageRenderer({
  currentPage,
}: {
  currentPage: ManagerPageId;
}) {
  switch (currentPage) {
    case 'shipments':
      return <ShipmentsPage />;
    case 'payments':
      return <PaymentsPage />;
    case 'receivables':
      return <ReceivablesPage />;
    case 'action-panel':
      return <ActionPanelPage />;
    case 'pipeline':
      return <PipelinePage />;
    case 'monitoring':
      return <MonitoringPage />;
    case 'risk-center':
      return <RiskCenterPage />;
    case 'billing':
      return <BillingPage />;
    case 'admin':
      return <AdminDashboardPage />;
    default:
      return <ShipmentsPage />;
  }
}

export default function App() {
  const [dataSourceConnected, setDataSourceConnected] = useState<boolean | null>(true);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const { currentPage, setCurrentPage } = useManagerRouteState();
  const currentPageMemo = useMemo(() => currentPage, [currentPage]);

  useEffect(() => {
    // External data sources disabled; skip checks
    setDataSourceConnected(true);
  }, []);

  // Gate: show data source setup until connected
  if (dataSourceConnected === false) {
    // External data sources disabled; skip setup
    return null;
  }

  if (dataSourceConnected === null) {
    return <div className="min-h-screen flex items-center justify-center text-muted-foreground">Loading…</div>;
  }

  const handleLogout = async () => {
    try {
      // Release internal session lock (best-effort)
      const sessionId = window.sessionStorage.getItem('internal_session_id');
      if (sessionId) {
        try {
          const { releaseInternalSession } = await import('@/app/api/ops');
          await releaseInternalSession(sessionId);
        } catch (e) {
          console.warn('Failed to release internal session lock', e);
        }
      }

      const sb = getSupabase();
      await sb.auth.signOut();
    } finally {
      window.location.href = authPortalUrl;
    }
  };

  return (
    <div className="min-h-screen">
      {/* Desktop sidebar */}
      <Sidebar currentPage={currentPageMemo} onPageChange={(page) => setCurrentPage(page as ManagerPageId)} onLogout={handleLogout} />

      {/* Mobile top bar */}
      <div
        className="md:hidden sticky top-0 z-40 border-b px-4 py-3 flex items-center gap-3"
        style={{ backgroundColor: 'var(--background)', borderColor: 'var(--border)' }}
      >
        <button
          type="button"
          onClick={() => setMobileNavOpen(true)}
          className="inline-flex items-center justify-center w-10 h-10 rounded border"
          style={{ borderColor: 'var(--border)' }}
          aria-label="Open navigation"
        >
          <Menu className="w-5 h-5" />
        </button>
        <div className="min-w-0 flex-1">
          <img src="/indataflow-logo.png" alt="InDataFlow" className="h-7 w-auto brightness-0 dark:invert" />
        </div>
      </div>

      {/* Mobile nav drawer */}
      <Sheet open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
        <SheetContent side="left" className="p-0" style={{ backgroundColor: 'var(--sidebar)' }}>
          <OpsSidebarContent
            currentPage={currentPageMemo}
            onPageChange={(page) => setCurrentPage(page as ManagerPageId)}
            onLogout={handleLogout}
            onNavigate={() => setMobileNavOpen(false)}
          />
        </SheetContent>
      </Sheet>

      <main className="min-h-screen px-4 py-4 sm:px-6 sm:py-6 md:ml-64 md:px-12 md:py-10">
        <Routes>
          <Route path="/" element={<Navigate to="/shipments" replace />} />
          <Route
            path="/:pageSlug"
            element={<ManagerPageRenderer key={currentPageMemo} currentPage={currentPageMemo} />}
          />
          <Route path="*" element={<Navigate to="/shipments" replace />} />
        </Routes>
      </main>
    </div>
  );
}
