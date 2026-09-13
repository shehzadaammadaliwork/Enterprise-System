import {
  Bell,
  CalendarCheck,
  CalendarClock,
  CalendarDays,
  ClipboardCheck,
  Handshake,
  Landmark,
  Plane,
  Receipt,
  TrendingUp,
  Users,
  type LucideIcon,
} from 'lucide-react';
import { useDashboardSummary, useLiveDashboard } from '../api/hooks';
import { formatMoney } from '../../finance/lib/format';
import { useAuthStore } from '../../../shared/stores/auth.store';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';

interface StatCard {
  label: string;
  value: string;
  hint: string;
  icon: LucideIcon;
}

/// Account-state rules (Dashboard/"My Work" visibility):
/// - State A (has an Employee profile): "My Work" shown as before.
/// - State B (no Employee profile, but has effective permissions — e.g.
///   Super Admin): "My Work" hidden entirely; Modules section shown per
///   permissions, plus "Upcoming events"/"My notifications" relocated there
///   since those two are User-scoped, not Employee-scoped. No attendance
///   widget ever — attendance is fundamentally Employee-scoped.
/// - State C (no Employee profile AND no effective permissions — a fresh
///   self-registered account never assigned a role): pending-setup message
///   only, nothing else.
type AccountState = 'A' | 'B' | 'C';

/// Module 16 (Dashboard full integration): real widgets, sourced from
/// GET /dashboard/summary, which itself omits a section entirely when the
/// caller lacks the underlying permission (server-side gate, not a
/// frontend hide) — the widget grid below only ever reflects what's
/// actually present in the response. useLiveDashboard subscribes to the
/// shared WebSocket for background refetches instead of polling or
/// requiring a page reload.
export function DashboardPage() {
  useLiveDashboard();
  const user = useAuthStore((state) => state.user);
  const roles = useAuthStore((state) => state.roles);
  const hasEmployeeProfile = useAuthStore((state) => state.hasEmployeeProfile);
  const hasAnyPermission = useAuthStore((state) => state.permissions.length > 0);
  const accountState: AccountState = hasEmployeeProfile ? 'A' : hasAnyPermission ? 'B' : 'C';

  // State C never needs dashboard data at all — nothing is rendered from it.
  const { data, isLoading } = useDashboardSummary(accountState !== 'C');

  if (accountState === 'C') {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="max-w-md rounded-lg border border-dashed px-8 py-12 text-center text-sm text-muted-foreground">
          Your account is not set as an employee profile yet. Contact Admin/HR for profile setup.
        </div>
      </div>
    );
  }

  // My Work section (State A only) — built from the employee's own
  // self-service data (attendance/leave/calendar/notifications), the same
  // data every "me" endpoint already exposes with no specific permission
  // required. This is what an employee with no business-module access (a
  // zero-role employee, or a designation like Frontend/Backend Developer
  // with nothing HR/Sales/Finance-specific specced for them) still sees
  // instead of a blank dashboard.
  const personalStats: StatCard[] =
    data && accountState === 'A'
      ? [
          {
            label: 'My attendance today',
            value: !data.personal.attendanceToday
              ? 'Not checked in'
              : data.personal.attendanceToday.checkOutAt
                ? 'Checked out'
                : 'Checked in',
            hint: data.personal.attendanceToday?.checkInAt
              ? `Since ${new Date(data.personal.attendanceToday.checkInAt).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}`
              : 'No record for today yet',
            icon: CalendarCheck,
          },
          {
            label: 'My leave',
            value: `${data.personal.pendingLeaveRequests} pending`,
            hint: `${data.personal.approvedLeaveDaysThisYear} day(s) taken this year`,
            icon: Plane,
          },
          {
            label: 'My upcoming events',
            value: String(data.personal.upcomingEvents.length),
            hint: data.personal.upcomingEvents[0]
              ? `Next: ${data.personal.upcomingEvents[0].title}`
              : 'Nothing scheduled',
            icon: CalendarDays,
          },
          {
            label: 'My notifications',
            value: String(data.personal.unreadNotificationsCount),
            hint: 'Unread',
            icon: Bell,
          },
        ]
      : [];

  const stats: StatCard[] = [
    // State B: no Employee profile, so "My Work" is hidden — Upcoming
    // events/notifications are User-scoped (not Employee-scoped), so they
    // move into Modules instead of disappearing. Never an attendance card
    // here — attendance has no meaning without an Employee record.
    ...(data && accountState === 'B'
      ? [
          {
            label: 'Upcoming events',
            value: String(data.personal.upcomingEvents.length),
            hint: data.personal.upcomingEvents[0]
              ? `Next: ${data.personal.upcomingEvents[0].title}`
              : 'Nothing scheduled',
            icon: CalendarDays,
          },
          {
            label: 'My notifications',
            value: String(data.personal.unreadNotificationsCount),
            hint: 'Unread',
            icon: Bell,
          },
        ]
      : []),
    ...(data?.hr
      ? [
          { label: 'Headcount', value: String(data.hr.headcount), hint: 'Active employees', icon: Users },
          {
            label: 'Attendance today',
            value: `${data.hr.presentToday} / ${data.hr.headcount}`,
            hint: 'Checked in today',
            icon: CalendarClock,
          },
          {
            label: 'Open leave requests',
            value: String(data.hr.pendingLeaveRequests),
            hint: 'Awaiting a decision',
            icon: ClipboardCheck,
          },
        ]
      : []),
    ...(data?.sales
      ? [
          {
            label: 'Sales pipeline',
            value: String(data.sales.openDealCount),
            hint: `${formatMoney(data.sales.openPipelineValue)} in open deals`,
            icon: Handshake,
          },
          {
            label: 'Revenue this month',
            value: formatMoney(data.sales.revenueThisMonth),
            hint: 'Payments recorded so far this month',
            icon: TrendingUp,
          },
        ]
      : []),
    ...(data?.finance
      ? [
          {
            label: 'Cash position',
            value: formatMoney(data.finance.cashPosition),
            hint: 'Across all active bank accounts',
            icon: Landmark,
          },
          {
            label: 'Outstanding invoices',
            value: String(data.finance.outstandingInvoicesCount),
            hint: `${formatMoney(data.finance.outstandingInvoicesTotal)} unpaid`,
            icon: Receipt,
          },
        ]
      : []),
  ];

  function renderGrid(cards: StatCard[]) {
    return (
      <div className="grid grid-cols-[repeat(auto-fill,minmax(220px,1fr))] gap-4">
        {cards.map(({ label, value, hint, icon: Icon }) => (
          <Card key={label}>
            <CardHeader className="flex-row items-center justify-between gap-2 space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle>
              <Icon className="size-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{value}</div>
              <p className="mt-1 text-xs text-muted-foreground">{hint}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold text-foreground">Welcome, {user?.firstName}</h1>
      <p className="mt-1 mb-6 text-sm text-muted-foreground">
        Signed in as {roles.map((role) => role.name).join(', ') || 'no role assigned'}.
      </p>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : (
        <>
          {accountState === 'A' && (
            <>
              <h2 className="mb-3 text-lg font-semibold text-foreground">My work</h2>
              <div className="mb-8">{renderGrid(personalStats)}</div>
            </>
          )}

          {stats.length > 0 && (
            <>
              <h2 className="mb-3 text-lg font-semibold text-foreground">Modules</h2>
              {renderGrid(stats)}
            </>
          )}
        </>
      )}
    </div>
  );
}
