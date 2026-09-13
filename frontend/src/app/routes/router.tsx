import { createBrowserRouter, Navigate } from 'react-router-dom';
import { AppLayout } from '../layouts/AppLayout';
import { RequireAuth } from '../../shared/guards/RequireAuth';
import { LoginPage } from '../../features/auth/pages/LoginPage';
import { RegisterPage } from '../../features/auth/pages/RegisterPage';
import { ForgotPasswordPage } from '../../features/auth/pages/ForgotPasswordPage';
import { ResetPasswordPage } from '../../features/auth/pages/ResetPasswordPage';
import { DashboardPage } from '../../features/dashboard/pages/DashboardPage';
import { OrganizationPage } from '../../features/organization/pages/OrganizationPage';
import { MyWorkPage } from '../../features/employees/pages/MyWorkPage';
import { EmployeesPage } from '../../features/employees/pages/EmployeesPage';
import { EmployeeDetailPage } from '../../features/employees/pages/EmployeeDetailPage';
import { UsersPage } from '../../features/employees/pages/UsersPage';
import { LeaveApprovalsPage } from '../../features/employees/pages/LeaveApprovalsPage';
import { LeaveRequestDetailPage } from '../../features/employees/pages/LeaveRequestDetailPage';
import { PayrollPage } from '../../features/employees/pages/PayrollPage';
import { PayrollRunDetailPage } from '../../features/employees/pages/PayrollRunDetailPage';
import { AuditLogsPage } from '../../features/audit-logs/pages/AuditLogsPage';
import { LeadsPage } from '../../features/crm/pages/LeadsPage';
import { LeadDetailPage } from '../../features/crm/pages/LeadDetailPage';
import { CustomersPage } from '../../features/crm/pages/CustomersPage';
import { CustomerDetailPage } from '../../features/crm/pages/CustomerDetailPage';
import { DealsPage } from '../../features/crm/pages/DealsPage';
import { DealDetailPage } from '../../features/crm/pages/DealDetailPage';
import { ProductsPage } from '../../features/sales/pages/ProductsPage';
import { QuotesPage } from '../../features/sales/pages/QuotesPage';
import { QuoteDetailPage } from '../../features/sales/pages/QuoteDetailPage';
import { OrdersPage } from '../../features/sales/pages/OrdersPage';
import { OrderDetailPage } from '../../features/sales/pages/OrderDetailPage';
import { InvoicesPage } from '../../features/sales/pages/InvoicesPage';
import { InvoiceDetailPage } from '../../features/sales/pages/InvoiceDetailPage';
import { BankAccountsPage } from '../../features/finance/pages/BankAccountsPage';
import { TransactionsPage } from '../../features/finance/pages/TransactionsPage';
import { TransactionDetailPage } from '../../features/finance/pages/TransactionDetailPage';
import { ReportsPage } from '../../features/finance/pages/ReportsPage';
import { AssetsPage } from '../../features/assets/pages/AssetsPage';
import { AssetDetailPage } from '../../features/assets/pages/AssetDetailPage';
import { PurchaseRequestsPage } from '../../features/purchasing/pages/PurchaseRequestsPage';
import { PurchaseRequestDetailPage } from '../../features/purchasing/pages/PurchaseRequestDetailPage';
import { NotificationsPage } from '../../features/notifications/pages/NotificationsPage';
import { CalendarPage } from '../../features/calendar/pages/CalendarPage';
import { ReportsHubPage } from '../../features/reports/pages/ReportsHubPage';
import { SettingsPage } from '../../features/settings/pages/SettingsPage';
import { ForbiddenPage } from '../../shared/components/ForbiddenPage';
import { PermissionGuard } from '../../shared/guards/PermissionGuard';

export const router = createBrowserRouter([
  { path: '/login', element: <LoginPage /> },
  { path: '/register', element: <RegisterPage /> },
  { path: '/forgot-password', element: <ForgotPasswordPage /> },
  { path: '/reset-password', element: <ResetPasswordPage /> },
  { path: '/forbidden', element: <ForbiddenPage /> },
  {
    element: <RequireAuth />,
    children: [
      {
        element: <AppLayout />,
        children: [
          { path: '/dashboard', element: <DashboardPage /> },
          {
            path: '/organization',
            element: (
              <PermissionGuard module="organization" action="VIEW">
                <OrganizationPage />
              </PermissionGuard>
            ),
          },
          { path: '/my-work', element: <MyWorkPage /> },
          { path: '/notifications', element: <NotificationsPage /> },
          {
            path: '/employees',
            element: (
              <PermissionGuard module="employees" action="VIEW">
                <EmployeesPage />
              </PermissionGuard>
            ),
          },
          {
            path: '/employees/:id',
            element: (
              <PermissionGuard module="employees" action="VIEW">
                <EmployeeDetailPage />
              </PermissionGuard>
            ),
          },
          {
            path: '/users',
            element: (
              <PermissionGuard module="employees" action="VIEW">
                <UsersPage />
              </PermissionGuard>
            ),
          },
          {
            path: '/leave-approvals',
            element: (
              <PermissionGuard module="employees" action="VIEW">
                <LeaveApprovalsPage />
              </PermissionGuard>
            ),
          },
          {
            path: '/leave-approvals/:id',
            element: (
              <PermissionGuard module="employees" action="VIEW">
                <LeaveRequestDetailPage />
              </PermissionGuard>
            ),
          },
          {
            path: '/payroll',
            element: (
              <PermissionGuard module="payroll" action="VIEW">
                <PayrollPage />
              </PermissionGuard>
            ),
          },
          {
            path: '/payroll/:id',
            element: (
              <PermissionGuard module="payroll" action="VIEW">
                <PayrollRunDetailPage />
              </PermissionGuard>
            ),
          },
          {
            path: '/audit-logs',
            element: (
              <PermissionGuard module="audit-logs" action="VIEW">
                <AuditLogsPage />
              </PermissionGuard>
            ),
          },
          {
            path: '/crm/leads',
            element: (
              <PermissionGuard module="crm" action="VIEW">
                <LeadsPage />
              </PermissionGuard>
            ),
          },
          {
            path: '/crm/leads/:id',
            element: (
              <PermissionGuard module="crm" action="VIEW">
                <LeadDetailPage />
              </PermissionGuard>
            ),
          },
          {
            path: '/crm/customers',
            element: (
              <PermissionGuard module="crm" action="VIEW">
                <CustomersPage />
              </PermissionGuard>
            ),
          },
          {
            path: '/crm/customers/:id',
            element: (
              <PermissionGuard module="crm" action="VIEW">
                <CustomerDetailPage />
              </PermissionGuard>
            ),
          },
          {
            path: '/crm/deals',
            element: (
              <PermissionGuard module="crm" action="VIEW">
                <DealsPage />
              </PermissionGuard>
            ),
          },
          {
            path: '/crm/deals/:id',
            element: (
              <PermissionGuard module="crm" action="VIEW">
                <DealDetailPage />
              </PermissionGuard>
            ),
          },
          {
            path: '/sales/products',
            element: (
              <PermissionGuard module="sales" action="VIEW">
                <ProductsPage />
              </PermissionGuard>
            ),
          },
          {
            path: '/sales/quotes',
            element: (
              <PermissionGuard module="sales" action="VIEW">
                <QuotesPage />
              </PermissionGuard>
            ),
          },
          {
            path: '/sales/quotes/:id',
            element: (
              <PermissionGuard module="sales" action="VIEW">
                <QuoteDetailPage />
              </PermissionGuard>
            ),
          },
          {
            path: '/sales/orders',
            element: (
              <PermissionGuard module="sales" action="VIEW">
                <OrdersPage />
              </PermissionGuard>
            ),
          },
          {
            path: '/sales/orders/:id',
            element: (
              <PermissionGuard module="sales" action="VIEW">
                <OrderDetailPage />
              </PermissionGuard>
            ),
          },
          {
            path: '/sales/invoices',
            element: (
              <PermissionGuard module="sales" action="VIEW">
                <InvoicesPage />
              </PermissionGuard>
            ),
          },
          {
            path: '/sales/invoices/:id',
            element: (
              <PermissionGuard module="sales" action="VIEW">
                <InvoiceDetailPage />
              </PermissionGuard>
            ),
          },
          {
            path: '/finance/bank-accounts',
            element: (
              <PermissionGuard module="finance" action="VIEW">
                <BankAccountsPage />
              </PermissionGuard>
            ),
          },
          {
            path: '/finance/transactions',
            element: (
              <PermissionGuard module="finance" action="VIEW">
                <TransactionsPage />
              </PermissionGuard>
            ),
          },
          {
            path: '/finance/transactions/:id',
            element: (
              <PermissionGuard module="finance" action="VIEW">
                <TransactionDetailPage />
              </PermissionGuard>
            ),
          },
          {
            path: '/finance/reports',
            element: (
              <PermissionGuard module="finance" action="VIEW">
                <ReportsPage />
              </PermissionGuard>
            ),
          },
          {
            path: '/assets',
            element: (
              <PermissionGuard module="inventory" action="VIEW">
                <AssetsPage />
              </PermissionGuard>
            ),
          },
          {
            path: '/assets/:id',
            element: (
              <PermissionGuard module="inventory" action="VIEW">
                <AssetDetailPage />
              </PermissionGuard>
            ),
          },
          {
            path: '/purchase-requests',
            element: (
              <PermissionGuard module="procurement" action="VIEW">
                <PurchaseRequestsPage />
              </PermissionGuard>
            ),
          },
          {
            path: '/purchase-requests/:id',
            element: (
              <PermissionGuard module="procurement" action="VIEW">
                <PurchaseRequestDetailPage />
              </PermissionGuard>
            ),
          },
          {
            path: '/calendar',
            element: (
              <PermissionGuard module="calendar" action="VIEW">
                <CalendarPage />
              </PermissionGuard>
            ),
          },
          {
            path: '/reports',
            element: (
              <PermissionGuard module="reports" action="VIEW">
                <ReportsHubPage />
              </PermissionGuard>
            ),
          },
          {
            path: '/settings',
            element: (
              <PermissionGuard module="settings" action="VIEW">
                <SettingsPage />
              </PermissionGuard>
            ),
          },
          // Each module adds its own role/permission-guarded route here as
          // its frontend feature lands.
        ],
      },
    ],
  },
  { path: '/', element: <Navigate to="/dashboard" replace /> },
  { path: '*', element: <Navigate to="/dashboard" replace /> },
]);
