import { AppHeader } from "@/components/layout/app-header";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { requireUser } from "@/lib/auth/session";

export default async function AuthenticatedLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const user = await requireUser();

  return (
    <main className="shell py-4">
      <div className="grid gap-4 lg:grid-cols-[18rem_minmax(0,1fr)]">
        <AppSidebar user={user} />
        <div className="space-y-4">
          <AppHeader user={user} />
          {children}
        </div>
      </div>
    </main>
  );
}
