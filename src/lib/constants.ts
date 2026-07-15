import { AppStatus, EnquiryStatus, Role } from "@prisma/client";

export const appName = "Appathy";

export const publicNavItems = [
  { href: "/", label: "Home" },
  { href: "/apps", label: "Portfolio" },
  { href: "/services", label: "Services" },
  { href: "/faq", label: "FAQ" },
  { href: "/contact", label: "Contact" }
];

export const adminNavItems = [
  { href: "/admin/dashboard", label: "Overview" },
  { href: "/admin/apps", label: "Control" },
  { href: "/admin/content", label: "Content" },
  { href: "/admin/enquiries", label: "Enquiries" },
  { href: "/admin/users", label: "Access" },
  { href: "/admin/settings", label: "Platform" }
];

export const roleLabels: Record<Role, string> = {
  SUPER_ADMIN: "Super Admin",
  ADMIN: "Admin",
  EDITOR: "Editor",
  VIEWER: "Viewer"
};

export const enquiryStatusTone: Record<EnquiryStatus, string> = {
  NEW: "bg-primary/10 text-primary",
  READ: "bg-secondary text-secondary-foreground",
  REPLIED: "bg-success/10 text-success",
  CLOSED: "bg-muted text-muted-foreground"
};

export const appStatusTone: Record<AppStatus, string> = {
  LIVE: "bg-success/10 text-success",
  IN_DEVELOPMENT: "bg-primary/10 text-primary",
  PAUSED: "bg-warning/15 text-warning",
  ARCHIVED: "bg-muted text-muted-foreground"
};
