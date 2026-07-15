import { prisma } from "@/lib/prisma";
import { Card } from "@/components/ui/card";
import { roleLabels } from "@/lib/constants";
import { saveUserAction } from "@/app/admin/(portal)/actions";

export default async function AdminUsersPage() {
  const users = await prisma.user.findMany({
    orderBy: { createdAt: "asc" }
  });

  return (
    <div className="space-y-6">
      <Card className="p-8">
        <div className="eyebrow">Access</div>
        <h1 className="mt-4 text-4xl font-semibold tracking-tight">Users and roles</h1>
      </Card>

      <div className="grid gap-4 xl:grid-cols-[1fr_0.75fr]">
        <Card className="p-6">
          <h2 className="text-xl font-semibold">Current users</h2>
          <div className="mt-5 space-y-4">
            {users.map((user) => (
              <form action={saveUserAction} className="rounded-[1.5rem] border border-border/70 p-4" key={user.id}>
                <input name="id" type="hidden" value={user.id} />
                <div className="grid gap-4 md:grid-cols-2">
                  <input className="flex h-11 w-full rounded-[1.15rem] border border-input bg-background/88 px-4" defaultValue={user.name} name="name" />
                  <input className="flex h-11 w-full rounded-[1.15rem] border border-input bg-background/88 px-4" defaultValue={user.email} name="email" />
                </div>
                <div className="mt-4 grid gap-4 md:grid-cols-2">
                  <select className="flex h-11 w-full rounded-[1.15rem] border border-input bg-background/88 px-4" defaultValue={user.role} name="role">
                    {Object.entries(roleLabels).map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                  <input className="flex h-11 w-full rounded-[1.15rem] border border-input bg-background/88 px-4" name="password" placeholder="Set a new password" />
                </div>
                <label className="mt-4 inline-flex items-center gap-2 text-sm">
                  <input defaultChecked={user.status === "disabled"} name="disabled" type="checkbox" />
                  Disable user
                </label>
                <button className="mt-4 rounded-full bg-foreground px-4 py-2 text-sm font-semibold text-background" type="submit">
                  Save user
                </button>
              </form>
            ))}
          </div>
        </Card>

        <Card className="p-6">
          <h2 className="text-xl font-semibold">Add user</h2>
          <form action={saveUserAction} className="mt-5 space-y-4" data-testid="create-user-form">
            <input aria-label="New user name" className="flex h-11 w-full rounded-[1.15rem] border border-input bg-background/88 px-4" data-testid="create-user-name" name="name" placeholder="Full name" />
            <input aria-label="New user email" className="flex h-11 w-full rounded-[1.15rem] border border-input bg-background/88 px-4" data-testid="create-user-email" name="email" placeholder="Email" />
            <input aria-label="New user password" className="flex h-11 w-full rounded-[1.15rem] border border-input bg-background/88 px-4" data-testid="create-user-password" name="password" placeholder="Temporary password" />
            <select aria-label="New user role" className="flex h-11 w-full rounded-[1.15rem] border border-input bg-background/88 px-4" data-testid="create-user-role" defaultValue="VIEWER" name="role">
              {Object.entries(roleLabels).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
            <button className="rounded-full bg-foreground px-4 py-2 text-sm font-semibold text-background" data-testid="create-user-submit" type="submit">
              Create user
            </button>
          </form>
        </Card>
      </div>
    </div>
  );
}
