import { prisma } from "@/lib/db/prisma";
import { Card } from "@/components/ui/card";
import { requireUser } from "@/lib/auth/session";
import { PERMISSIONS } from "@/lib/constants/permissions";
import { createUserAction, updateUserAccessAction } from "@/server/actions/crm";

export default async function UsersPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  await requireUser(PERMISSIONS.USERS_VIEW);
  const params = await searchParams;
  const [users, roles] = await Promise.all([
    prisma.user.findMany({
      include: {
        userRoles: {
          include: { role: true }
        }
      },
      orderBy: [{ firstName: "asc" }, { lastName: "asc" }]
    }),
    prisma.role.findMany({
      orderBy: { name: "asc" }
    })
  ]);

  return (
    <div className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
      <Card className="p-6">
        <div className="eyebrow">Staff</div>
        <h1 className="mt-3 text-2xl font-semibold tracking-tight">Users, roles, and access levels</h1>
        {params.saved ? <p className="mt-4 rounded-2xl bg-success/10 px-4 py-3 text-sm text-success">User settings saved.</p> : null}
        {params.error ? <p className="mt-4 rounded-2xl bg-danger/10 px-4 py-3 text-sm text-danger">We couldn&apos;t save that user change.</p> : null}
        <div className="mt-5 space-y-4">
          {users.map((user) => {
            const roleId = user.userRoles[0]?.roleId ?? "";

            return (
              <form action={updateUserAccessAction} className="rounded-2xl border border-border/70 p-4" key={user.id}>
                <input name="userId" type="hidden" value={user.id} />
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <p className="font-semibold">
                      {user.firstName} {user.lastName}
                    </p>
                    <p className="text-sm text-muted-foreground">{user.email}</p>
                    <p className="mt-2 text-xs uppercase tracking-[0.2em] text-primary">{user.userRoles.map((entry) => entry.role.name).join(", ")}</p>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-3">
                    <input
                      className="h-10 rounded-2xl border border-border/70 bg-background/70 px-4 text-sm"
                      defaultValue={user.jobTitle ?? ""}
                      name="jobTitle"
                      placeholder="Job title"
                    />
                    <select className="h-10 rounded-2xl border border-border/70 bg-background/70 px-4 text-sm" defaultValue={roleId} name="roleId">
                      {roles.map((role) => (
                        <option key={role.id} value={role.id}>
                          {role.name}
                        </option>
                      ))}
                    </select>
                    <select className="h-10 rounded-2xl border border-border/70 bg-background/70 px-4 text-sm" defaultValue={user.status} name="status">
                      <option value="ACTIVE">ACTIVE</option>
                      <option value="INVITED">INVITED</option>
                      <option value="DISABLED">DISABLED</option>
                    </select>
                  </div>
                </div>
                <button className="mt-4 inline-flex h-10 items-center justify-center rounded-2xl border border-border/70 px-4 text-sm font-semibold" type="submit">
                  Update access
                </button>
              </form>
            );
          })}
        </div>
      </Card>

      <Card className="p-6">
        <div className="eyebrow">New user</div>
        <h2 className="mt-3 text-xl font-semibold">Invite or create a staff account</h2>
        <form action={createUserAction} className="mt-5 space-y-4">
          <div className="grid gap-4 lg:grid-cols-2">
            <input className="h-11 rounded-2xl border border-border/70 bg-background/70 px-4 text-sm" name="firstName" placeholder="First name" required />
            <input className="h-11 rounded-2xl border border-border/70 bg-background/70 px-4 text-sm" name="lastName" placeholder="Last name" required />
          </div>
          <input className="h-11 w-full rounded-2xl border border-border/70 bg-background/70 px-4 text-sm" name="email" placeholder="Email address" required type="email" />
          <input className="h-11 w-full rounded-2xl border border-border/70 bg-background/70 px-4 text-sm" name="jobTitle" placeholder="Job title" />
          <div className="grid gap-4 lg:grid-cols-2">
            <select className="h-11 rounded-2xl border border-border/70 bg-background/70 px-4 text-sm" name="roleId" required>
              <option value="">Role</option>
              {roles.map((role) => (
                <option key={role.id} value={role.id}>
                  {role.name}
                </option>
              ))}
            </select>
            <select className="h-11 rounded-2xl border border-border/70 bg-background/70 px-4 text-sm" defaultValue="ACTIVE" name="status">
              <option value="ACTIVE">ACTIVE</option>
              <option value="INVITED">INVITED</option>
              <option value="DISABLED">DISABLED</option>
            </select>
          </div>
          <input className="h-11 w-full rounded-2xl border border-border/70 bg-background/70 px-4 text-sm" name="password" placeholder="Temporary password" required type="password" />
          <button className="inline-flex h-11 items-center justify-center rounded-2xl bg-foreground px-4 text-sm font-semibold text-background" type="submit">
            Create user
          </button>
        </form>
      </Card>
    </div>
  );
}
