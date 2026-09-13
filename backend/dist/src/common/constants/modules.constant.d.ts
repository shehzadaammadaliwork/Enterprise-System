export declare const MODULES: readonly ["auth", "rbac", "dashboard", "organization", "employees", "payroll", "audit-logs", "crm", "sales", "finance", "inventory", "procurement", "documents", "notifications", "calendar", "reports", "settings", "integrations"];
export type ModuleSlug = (typeof MODULES)[number];
export declare const PERMISSION_ACTIONS: readonly ["VIEW", "CREATE", "EDIT", "DELETE"];
export type PermissionActionSlug = (typeof PERMISSION_ACTIONS)[number];
