import { requireAuth } from "@/lib/auth";
import { AdminShell } from "@/components/admin/admin-shell";

export default async function AdminPortalLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const user = await requireAuth();
  return <AdminShell user={user}>{children}</AdminShell>;
}
