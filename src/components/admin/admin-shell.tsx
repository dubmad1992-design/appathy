"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LayoutDashboard, Menu, PanelLeft, Settings2, Shield, Sparkles, SquareTerminal, Users, X } from "lucide-react";
import { adminNavItems } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";

const icons = {
  "/admin/dashboard": LayoutDashboard,
  "/admin/apps": SquareTerminal,
  "/admin/content": Sparkles,
  "/admin/enquiries": PanelLeft,
  "/admin/users": Users,
  "/admin/settings": Settings2
};

export function AdminShell({
  children,
  user
}: Readonly<{
  children: React.ReactNode;
  user: { name: string; email: string; role: string };
}>) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/admin/login");
    router.refresh();
  }

  function SidebarContent() {
    return (
      <>
        <div className="mb-8 rounded-[1.7rem] border border-border/70 bg-card/70 p-4">
          <div className="eyebrow">Admin</div>
          <h1 className="mt-4 text-2xl font-semibold tracking-tight">Appathy control</h1>
          <p className="mt-3 text-sm leading-7 text-muted-foreground">A cleaner backend for the apps, content, and operations that sit on this VPS.</p>
        </div>

        <nav className="space-y-2">
          {adminNavItems.map((item) => {
            const Icon = icons[item.href as keyof typeof icons];
            return (
              <Link
                className={cn(
                  "flex items-center gap-3 rounded-[1.2rem] px-4 py-3 text-sm font-medium transition",
                  pathname === item.href ? "bg-foreground text-background" : "text-muted-foreground hover:bg-card hover:text-foreground"
                )}
                href={item.href}
                key={item.href}
                onClick={() => setMobileOpen(false)}
              >
                {Icon ? <Icon className="h-4 w-4" /> : null}
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="mt-8 rounded-[1.6rem] border border-border/70 bg-secondary/50 p-4">
          <div className="flex items-center gap-3">
            <Shield className="h-4 w-4 text-primary" />
            <div>
              <p className="text-sm font-semibold">{user.name}</p>
              <p className="text-xs text-muted-foreground">
                {user.role.replaceAll("_", " ")} • {user.email}
              </p>
            </div>
          </div>
          <Button className="mt-4 w-full" onClick={logout} variant="outline">
            Sign out
          </Button>
        </div>
      </>
    );
  }

  return (
    <div className="shell py-6 lg:py-8">
      <div className="panel mb-4 flex items-center justify-between px-4 py-3 lg:hidden">
        <div>
          <div className="text-xs font-semibold uppercase tracking-[0.22em] text-primary">Appathy</div>
          <div className="text-sm text-muted-foreground">Admin control</div>
        </div>
        <Dialog onOpenChange={setMobileOpen} open={mobileOpen}>
          <DialogTrigger asChild>
            <Button size="icon" variant="outline">
              <Menu className="h-4 w-4" />
            </Button>
          </DialogTrigger>
          <DialogContent className="left-0 top-0 h-screen w-[90vw] max-w-sm translate-x-0 translate-y-0 rounded-none border-r border-border p-0">
            <div className="h-full overflow-y-auto bg-background px-5 py-5">
              <div className="mb-5 flex items-center justify-between">
                <div className="text-sm font-semibold uppercase tracking-[0.22em] text-primary">Appathy admin</div>
                <button onClick={() => setMobileOpen(false)} type="button">
                  <X className="h-5 w-5" />
                </button>
              </div>
              <SidebarContent />
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
        <aside className="panel hidden h-fit p-5 lg:block">
          <SidebarContent />
        </aside>

        <div className="min-w-0 space-y-6">{children}</div>
      </div>
    </div>
  );
}
