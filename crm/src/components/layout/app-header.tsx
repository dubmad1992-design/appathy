import { Bell, Search } from "lucide-react";
import { logoutAction } from "@/server/actions/auth";
import type { SessionUser } from "@/types";

export function AppHeader({ user }: { user: SessionUser }) {
  return (
    <header className="panel flex flex-col gap-4 px-5 py-4 lg:flex-row lg:items-center lg:justify-between">
      <div>
        <p className="text-sm text-muted-foreground">Signed in as {user.email}</p>
        <h2 className="text-2xl font-semibold tracking-tight">Control the billing lifecycle without losing the customer context.</h2>
      </div>
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 rounded-2xl border border-border/70 bg-background/70 px-4 py-2 text-sm text-muted-foreground">
          <Search className="h-4 w-4" />
          Global search coming next
        </div>
        <a className="inline-flex h-10 items-center justify-center rounded-2xl border border-border/80 px-4 text-sm font-semibold" href="/notifications">
          <Bell className="mr-2 h-4 w-4" />
          Alerts
        </a>
        <form action={logoutAction}>
          <button className="inline-flex h-10 items-center justify-center rounded-2xl bg-foreground px-4 text-sm font-semibold text-background" type="submit">
            Sign out
          </button>
        </form>
      </div>
    </header>
  );
}
