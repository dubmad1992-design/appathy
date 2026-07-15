export type NavItem = {
  href: string;
  label: string;
  permission?: string;
};

export type SessionUser = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  status: string;
  roles: string[];
  permissions: string[];
};

export type TemplateContext = Record<string, unknown>;
