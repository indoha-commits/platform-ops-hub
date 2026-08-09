import {
  Activity,
  AlertTriangle,
  BarChart3,
  Building2,
  Cpu,
  FileText,
  Inbox,
  Layers,
  LogOut,
  Moon,
  PlusCircle,
  RefreshCw,
  Settings,
  Sun,
  User,
  Wallet,
  Webhook,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '@/app/components/ui/dropdown-menu';
import { useThemeToggle } from '@/app/hooks/useThemeToggle';

interface OpsSidebarContentProps {
  currentPage: string;
  onPageChange: (page: string) => void;
  onLogout: () => void;
  onNavigate?: () => void;
}

type NavGroup = {
  label: string;
  items: Array<{ id: string; label: string; icon: React.ElementType }>;
};

const navGroups: NavGroup[] = [
  {
    label: 'Overview',
    items: [
      { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
    ],
  },
  {
    label: 'Tenants',
    items: [
      { id: 'tenants', label: 'Tenants', icon: Building2 },
    ],
  },
  {
    label: 'Monitoring',
    items: [
      { id: 'monitoring', label: 'Overview', icon: Activity },
      { id: 'errors', label: 'Errors', icon: AlertTriangle },
      { id: 'queues', label: 'Queues & Jobs', icon: Layers },
      { id: 'documents', label: 'Documents', icon: FileText },
      { id: 'webhooks', label: 'Webhooks', icon: Webhook },
      { id: 'vps', label: 'VPS', icon: Cpu },
      { id: 'activity', label: 'Activity Feed', icon: Activity },
      { id: 'inbox', label: 'Inbox', icon: Inbox },
    ],
  },
  {
    label: 'Provisioning',
    items: [
      { id: 'new-tenant', label: 'New Tenant', icon: PlusCircle },
    ],
  },
  {
    label: 'Billing',
    items: [
      { id: 'billing', label: 'Billing', icon: Wallet },
    ],
  },
];

function NavButton({
  item,
  currentPage,
  onPageChange,
  onNavigate,
}: {
  item: NavGroup['items'][number];
  currentPage: string;
  onPageChange: (page: string) => void;
  onNavigate?: () => void;
}) {
  const Icon = item.icon;
  const isActive = currentPage === item.id;

  return (
    <button
      onClick={() => {
        onPageChange(item.id);
        onNavigate?.();
      }}
      aria-current={isActive ? 'page' : undefined}
      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-md border-l-[3px] transition-all duration-150"
      style={{
        borderLeftColor: isActive ? '#5e6ad2' : 'transparent',
        paddingLeft: isActive ? '9px' : '13px',
        backgroundColor: isActive ? 'rgba(94, 106, 210, 0.25)' : 'transparent',
        color: isActive ? '#f7f8f8' : 'var(--sidebar-foreground)',
      }}
      onMouseEnter={(e) => {
        if (!isActive) e.currentTarget.style.backgroundColor = 'var(--sidebar-accent)';
      }}
      onMouseLeave={(e) => {
        if (!isActive) e.currentTarget.style.backgroundColor = 'transparent';
      }}
    >
      <Icon className="w-[18px] h-[18px]" strokeWidth={1.5} style={{ opacity: isActive ? 1 : 0.65 }} />
      <span className="text-sm" style={{ fontWeight: isActive ? 600 : 400 }}>{item.label}</span>
    </button>
  );
}

export function OpsSidebarContent({ currentPage, onPageChange, onLogout, onNavigate }: OpsSidebarContentProps) {
  const now = new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
  const { theme, toggleTheme } = useThemeToggle();

  return (
    <div className="flex flex-col min-h-full whitespace-nowrap">
      {/* Brand header */}
      <div className="sticky top-0 z-10 flex items-center px-6 py-6 md:py-8 border-b" style={{ backgroundColor: 'var(--sidebar)', borderColor: 'var(--sidebar-border)' }}>
        <img
          src="/indataflow-logo.png"
          alt="InDataFlow"
          className="h-[56px] md:h-[67px] w-auto brightness-0 invert"
        />
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 md:py-6" aria-label="Main navigation">
        {navGroups.map((group) => (
          <div key={group.label} className="mb-6">
            <div
              className="px-3 mb-1.5 text-xs font-semibold uppercase tracking-wider"
              style={{ color: 'var(--sidebar-foreground)', opacity: 0.5 }}
            >
              {group.label}
            </div>
            <div className="space-y-0.5">
              {group.items.map((item) => (
                <NavButton
                  key={item.id}
                  item={item}
                  currentPage={currentPage}
                  onPageChange={onPageChange}
                  onNavigate={onNavigate}
                />
              ))}
            </div>
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="border-t shrink-0" style={{ borderColor: 'var(--sidebar-border)' }}>
        <div className="px-5 py-3 flex items-center gap-2" style={{ opacity: 0.7, color: '#5e6ad2' }}>
          <RefreshCw className="w-3 h-3 shrink-0" />
          <span className="text-xs font-medium">Live · {now}</span>
        </div>
        <div className="mx-4 border-t" style={{ borderColor: 'var(--sidebar-border)' }} />
        <div className="px-3 py-3">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-md transition-all duration-150"
                style={{ color: 'var(--sidebar-foreground)', backgroundColor: 'transparent' }}
                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--sidebar-accent)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
              >
                <span
                  className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
                  style={{ backgroundColor: 'rgba(255,255,255,0.08)' }}
                >
                  <User className="w-[18px] h-[18px]" strokeWidth={1.5} style={{ opacity: 0.7 }} />
                </span>
                <span className="text-sm flex-1 text-left" style={{ opacity: 0.7 }}>Account</span>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" side="top" className="w-48">
              <DropdownMenuItem onClick={toggleTheme} className="flex items-center gap-3 cursor-pointer">
                {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                <span>{theme === 'dark' ? 'Light mode' : 'Dark mode'}</span>
              </DropdownMenuItem>
              <DropdownMenuItem className="flex items-center gap-3 cursor-pointer">
                <Settings className="w-4 h-4" />
                <span>Settings</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={onLogout} className="flex items-center gap-3 cursor-pointer text-red-600 dark:text-red-400">
                <LogOut className="w-4 h-4" />
                <span>Sign out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  );
}
