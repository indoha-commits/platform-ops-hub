import { useMemo, useState } from 'react';
import { Menu } from 'lucide-react';
import { Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import { Sidebar } from '@/app/components/Sidebar';
import { OpsSidebarContent } from '@/app/components/OpsSidebarContent';
import { Sheet, SheetContent } from '@/app/components/ui/sheet';
import DashboardPage from '@/app/components/pages/platform/DashboardPage';
import TenantsPage from '@/app/components/pages/platform/TenantsPage';
import ActivityPage from '@/app/components/pages/platform/ActivityPage';
import InboxPage from '@/app/components/pages/platform/InboxPage';
import NewTenantPage from '@/app/components/pages/platform/NewTenantPage';
import BillingPage from '@/app/components/pages/platform/BillingPage';
import TenantSettingsPage from '@/app/components/pages/platform/TenantSettingsPage';

type PlatformPageId =
  | 'dashboard'
  | 'tenants'
  | 'activity'
  | 'inbox'
  | 'new-tenant'
  | 'billing';

const pageToPath: Record<PlatformPageId, string> = {
  dashboard: 'dashboard',
  tenants: 'tenants',
  activity: 'activity',
  inbox: 'inbox',
  'new-tenant': 'new-tenant',
  billing: 'billing',
};

const pathToPage: Record<string, PlatformPageId> = {
  dashboard: 'dashboard',
  tenants: 'tenants',
  activity: 'activity',
  inbox: 'inbox',
  'new-tenant': 'new-tenant',
  billing: 'billing',
};

function usePlatformRouteState() {
  const navigate = useNavigate();
  const location = useLocation();

  const pageSlug = location.pathname.replace(/^\//, '');
  const normalizedPage = pageSlug && pageSlug in pathToPage ? (pageSlug as PlatformPageId) : 'dashboard';
  const currentPage = pathToPage[normalizedPage] ?? 'dashboard';

  const setCurrentPage = (page: PlatformPageId) => {
    const pagePath = pageToPath[page];
    const target = `/${pagePath}`.replace(/\/+$/, '') || '/';
    if (target === location.pathname) return;
    navigate(target);
  };

  return { currentPage, setCurrentPage };
}

function PlatformPageRenderer({ currentPage }: { currentPage: PlatformPageId }) {
  switch (currentPage) {
    case 'dashboard': return <DashboardPage />;
    case 'tenants': return <TenantsPage />;
    case 'activity': return <ActivityPage />;
    case 'inbox': return <InboxPage />;
    case 'new-tenant': return <NewTenantPage />;
    case 'billing': return <BillingPage />;
    default: return <DashboardPage />;
  }
}

export default function App() {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const { currentPage, setCurrentPage } = usePlatformRouteState();
  const currentPageMemo = useMemo(() => currentPage, [currentPage]);

  const handleLogout = () => {
    window.location.href = (import.meta.env as any).VITE_AUTH_PORTAL_URL || '/';
  };

  return (
    <div className="min-h-screen">
      <Sidebar currentPage={currentPageMemo} onPageChange={(page) => setCurrentPage(page as PlatformPageId)} onLogout={handleLogout} />

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
          <img src="/indataflow-logo.png" alt="Platform Ops Hub" className="h-7 w-auto brightness-0 dark:invert" />
        </div>
      </div>

      <Sheet open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
        <SheetContent side="left" className="p-0" style={{ backgroundColor: 'var(--sidebar)' }}>
          <OpsSidebarContent
            currentPage={currentPageMemo}
            onPageChange={(page) => setCurrentPage(page as PlatformPageId)}
            onLogout={handleLogout}
            onNavigate={() => setMobileNavOpen(false)}
          />
        </SheetContent>
      </Sheet>

      <main className="min-h-screen px-4 py-4 sm:px-6 sm:py-6 md:ml-64 md:px-12 md:py-10">
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/tenant/:id" element={<TenantSettingsPage />} />
          <Route path="/:pageSlug" element={<PlatformPageRenderer key={currentPageMemo} currentPage={currentPageMemo} />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </main>
    </div>
  );
}
