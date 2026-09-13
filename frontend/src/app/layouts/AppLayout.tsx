import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import {
  ArrowLeftRight,
  BarChart3,
  Bell,
  Building2,
  Calendar,
  CalendarCheck,
  ClipboardCheck,
  ClipboardList,
  Contact,
  FileText,
  Handshake,
  Landmark,
  Laptop,
  LayoutDashboard,
  LogOut,
  Moon,
  Package,
  PieChart,
  Receipt,
  ScrollText,
  Settings as SettingsIcon,
  ShoppingCart,
  Sun,
  Target,
  UserCog,
  Users,
  Wallet,
  type LucideIcon,
} from 'lucide-react';
import { logout as logoutRequest } from '../../features/auth/api/auth.api';
import { NotificationBell } from '../../features/notifications/components/NotificationBell';
import { useAuthStore } from '../../shared/stores/auth.store';
import { useTheme } from '../../shared/hooks/useTheme';
import { cn } from '../../lib/utils';
import { Avatar, AvatarFallback } from '../../components/ui/avatar';
import { Button } from '../../components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../../components/ui/dropdown-menu';

interface NavItem {
  to: string;
  label: string;
  icon: LucideIcon;
}

/// Shell for every authenticated route: sidebar nav + topbar with a user
/// menu, and an <Outlet/> for the page. Nav items grow as each module's
/// frontend feature lands.
export function AppLayout() {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const roles = useAuthStore((state) => state.roles);
  const hasEmployeeProfile = useAuthStore((state) => state.hasEmployeeProfile);
  const hasAnyPermission = useAuthStore((state) => state.permissions.length > 0);
  const clearAuth = useAuthStore((state) => state.clearAuth);
  const canViewOrganization = useAuthStore((state) => state.hasPermission('organization', 'VIEW'));
  const canViewCalendar = useAuthStore((state) => state.hasPermission('calendar', 'VIEW'));
  const canViewEmployees = useAuthStore((state) => state.hasPermission('employees', 'VIEW'));
  const canViewPayroll = useAuthStore((state) => state.hasPermission('payroll', 'VIEW'));
  const canViewAuditLogs = useAuthStore((state) => state.hasPermission('audit-logs', 'VIEW'));
  const canViewCrm = useAuthStore((state) => state.hasPermission('crm', 'VIEW'));
  const canViewSales = useAuthStore((state) => state.hasPermission('sales', 'VIEW'));
  const canViewFinance = useAuthStore((state) => state.hasPermission('finance', 'VIEW'));
  const canViewInventory = useAuthStore((state) => state.hasPermission('inventory', 'VIEW'));
  const canViewProcurement = useAuthStore((state) => state.hasPermission('procurement', 'VIEW'));
  const canViewReports = useAuthStore((state) => state.hasPermission('reports', 'VIEW'));
  const canViewSettings = useAuthStore((state) => state.hasPermission('settings', 'VIEW'));
  const { theme, toggleTheme } = useTheme();

  const logoutMutation = useMutation({
    mutationFn: logoutRequest,
    onSettled: () => {
      clearAuth();
      navigate('/login', { replace: true });
    },
  });

  const navItems: NavItem[] = [
    { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    ...(hasEmployeeProfile ? [{ to: '/my-work', label: 'My Work', icon: ClipboardList }] : []),
    // State C (no Employee profile AND no effective permissions) sees only
    // the Dashboard's pending-setup message — Notifications is hidden the
    // same way "My Work" is, just gated on "not State C" rather than
    // "State A" since it isn't Employee-scoped (see NotificationsPage's
    // matching route-level guard).
    ...(hasEmployeeProfile || hasAnyPermission
      ? [{ to: '/notifications', label: 'Notifications', icon: Bell }]
      : []),
    ...(canViewOrganization ? [{ to: '/organization', label: 'Organization', icon: Building2 }] : []),
    ...(canViewCalendar ? [{ to: '/calendar', label: 'Calendar', icon: Calendar }] : []),
    ...(canViewEmployees
      ? [
          { to: '/employees', label: 'Employees', icon: Users },
          { to: '/leave-approvals', label: 'Leave Approvals', icon: CalendarCheck },
          { to: '/users', label: 'Users', icon: UserCog },
        ]
      : []),
    ...(canViewPayroll ? [{ to: '/payroll', label: 'Payroll', icon: Wallet }] : []),
    ...(canViewAuditLogs ? [{ to: '/audit-logs', label: 'Audit Logs', icon: ScrollText }] : []),
    ...(canViewCrm
      ? [
          { to: '/crm/leads', label: 'Leads', icon: Target },
          { to: '/crm/customers', label: 'Customers', icon: Contact },
          { to: '/crm/deals', label: 'Deals', icon: Handshake },
        ]
      : []),
    ...(canViewSales
      ? [
          { to: '/sales/products', label: 'Catalog', icon: Package },
          { to: '/sales/quotes', label: 'Quotes', icon: FileText },
          { to: '/sales/orders', label: 'Orders', icon: ShoppingCart },
          { to: '/sales/invoices', label: 'Invoices', icon: Receipt },
        ]
      : []),
    ...(canViewFinance
      ? [
          { to: '/finance/bank-accounts', label: 'Bank Accounts', icon: Landmark },
          { to: '/finance/transactions', label: 'Transactions', icon: ArrowLeftRight },
          { to: '/finance/reports', label: 'Reports', icon: BarChart3 },
        ]
      : []),
    ...(canViewInventory ? [{ to: '/assets', label: 'Assets', icon: Laptop }] : []),
    ...(canViewProcurement
      ? [{ to: '/purchase-requests', label: 'Purchase Requests', icon: ClipboardCheck }]
      : []),
    ...(canViewReports ? [{ to: '/reports', label: 'Reports & Analytics', icon: PieChart }] : []),
    ...(canViewSettings ? [{ to: '/settings', label: 'Settings', icon: SettingsIcon }] : []),
  ];

  const initials = `${user?.firstName?.[0] ?? ''}${user?.lastName?.[0] ?? ''}`.toUpperCase();
  const roleLabel = roles.map((role) => role.name).join(', ') || 'No role assigned';

  return (
    <div className="flex min-h-svh bg-muted/30">
      <aside className="flex w-60 shrink-0 flex-col border-r bg-background">
        <div className="flex items-center gap-2.5 px-5 py-5">
          <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary text-sm font-bold text-primary-foreground">
            IT
          </span>
          <span className="text-[15px] font-bold">Innova Tech Biz</span>
        </div>

        <nav className="flex flex-1 flex-col gap-0.5 px-3">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-primary/10 text-primary'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                )
              }
            >
              <item.icon className="size-4 shrink-0" />
              {item.label}
            </NavLink>
          ))}
        </nav>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-end gap-2 border-b bg-background px-6 py-3">
          {/* State C (no Employee profile AND no effective permissions) has
              no business reason to see notifications — hide the bell itself,
              not just its dropdown contents, same rule as the nav item. */}
          {(hasEmployeeProfile || hasAnyPermission) && <NotificationBell />}

          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {theme === 'dark' ? <Moon className="size-4" /> : <Sun className="size-4" />}
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger className="flex items-center gap-2.5 rounded-full outline-none focus-visible:ring-2 focus-visible:ring-ring">
              <div className="hidden text-right text-sm sm:block">
                <div className="leading-tight font-medium">
                  {user?.firstName} {user?.lastName}
                </div>
                <div className="text-xs leading-tight text-muted-foreground">{roleLabel}</div>
              </div>
              <Avatar>
                <AvatarFallback className="bg-primary/10 text-primary">{initials}</AvatarFallback>
              </Avatar>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>
                {user?.firstName} {user?.lastName}
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                variant="destructive"
                onSelect={() => logoutMutation.mutate()}
                disabled={logoutMutation.isPending}
              >
                <LogOut className="size-4" />
                {logoutMutation.isPending ? 'Signing out…' : 'Sign out'}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </header>

        <main className="flex-1 overflow-auto p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
