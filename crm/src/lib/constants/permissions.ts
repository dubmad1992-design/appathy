import type { NavItem } from "@/types";

export const ROLE_KEYS = {
  ADMIN: "admin",
  STAFF: "staff",
  FINANCE: "finance",
  READ_ONLY: "read_only"
} as const;

export const PERMISSIONS = {
  DASHBOARD_VIEW: "dashboard.view",
  CUSTOMERS_VIEW: "customers.view",
  CUSTOMERS_MANAGE: "customers.manage",
  COMPANIES_VIEW: "companies.view",
  COMPANIES_MANAGE: "companies.manage",
  QUOTES_VIEW: "quotes.view",
  QUOTES_MANAGE: "quotes.manage",
  INVOICES_VIEW: "invoices.view",
  INVOICES_MANAGE: "invoices.manage",
  INVOICES_SEND: "invoices.send",
  PAYMENTS_MANAGE: "payments.manage",
  SUBSCRIPTIONS_VIEW: "subscriptions.view",
  SUBSCRIPTIONS_MANAGE: "subscriptions.manage",
  TASKS_VIEW: "tasks.view",
  TASKS_MANAGE: "tasks.manage",
  SETTINGS_VIEW: "settings.view",
  SETTINGS_MANAGE: "settings.manage",
  USERS_VIEW: "users.view",
  USERS_MANAGE: "users.manage",
  REPORTS_VIEW: "reports.view",
  NOTIFICATIONS_VIEW: "notifications.view",
  AUDIT_VIEW: "audit.view"
} as const;

export const crmNavigation: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", permission: PERMISSIONS.DASHBOARD_VIEW },
  { href: "/customers", label: "Customers", permission: PERMISSIONS.CUSTOMERS_VIEW },
  { href: "/companies", label: "Companies", permission: PERMISSIONS.COMPANIES_VIEW },
  { href: "/quotes", label: "Quotes", permission: PERMISSIONS.QUOTES_VIEW },
  { href: "/invoices", label: "Invoices", permission: PERMISSIONS.INVOICES_VIEW },
  { href: "/subscriptions", label: "Subscriptions", permission: PERMISSIONS.SUBSCRIPTIONS_VIEW },
  { href: "/outgoings", label: "Outgoings", permission: PERMISSIONS.SUBSCRIPTIONS_VIEW },
  { href: "/tasks", label: "Tasks", permission: PERMISSIONS.TASKS_VIEW },
  { href: "/reports", label: "Reports", permission: PERMISSIONS.REPORTS_VIEW },
  { href: "/notifications", label: "Notifications", permission: PERMISSIONS.NOTIFICATIONS_VIEW },
  { href: "/users", label: "Users", permission: PERMISSIONS.USERS_VIEW },
  { href: "/settings", label: "Settings", permission: PERMISSIONS.SETTINGS_VIEW }
];
