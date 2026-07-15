"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { crmNavigation } from "@/lib/constants/permissions";
import { cn } from "@/lib/utils";
import type { SessionUser } from "@/types";

type AppSidebarProps = {
  user: SessionUser;
};

function isActivePath(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function AppSidebar({ user }: AppSidebarProps) {
  const pathname = usePathname() ?? "";
  const items = crmNavigation.filter((item) => !item.permission || user.permissions.includes(item.permission));

  return (
    <aside className="panel sticky top-4 hidden h-[calc(100vh-2rem)] w-72 flex-col overflow-hidden lg:flex">
      <div className="border-b border-border/70 px-6 py-6">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-primary">Appathy CRM</p>
        <h1 className="mt-3 text-2xl font-semibold tracking-tight">Service billing control</h1>
        <p className="mt-2 text-sm text-muted-foreground">Customers, renewals, invoices, reminders, and reporting in one calm workspace.</p>
      </div>
      <nav className="flex-1 space-y-2 px-4 py-4">
        {items.map((item) => {
          const active = isActivePath(pathname, item.href);
          return (
            <Link
              className={cn(
                "block rounded-2xl px-4 py-3 text-sm font-medium transition-colors",
                active ? "bg-foreground text-background" : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
              href={item.href}
              key={item.href}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="border-t border-border/70 px-6 py-5 text-sm">
        <div className="font-medium">
          {user.firstName} {user.lastName}
        </div>
        <div className="mt-1 text-muted-foreground">{user.roles.join(", ")}</div>
      </div>
    </aside>
  );
}
