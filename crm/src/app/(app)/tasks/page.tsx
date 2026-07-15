import { prisma } from "@/lib/db/prisma";
import { Card } from "@/components/ui/card";
import { requireUser } from "@/lib/auth/session";
import { PERMISSIONS } from "@/lib/constants/permissions";
import { createTaskAction } from "@/server/actions/crm";
import { formatDate } from "@/lib/utils";
import { getCrmLookups } from "@/server/queries/lookups";

export default async function TasksPage() {
  await requireUser(PERMISSIONS.TASKS_VIEW);
  const [tasks, lookups] = await Promise.all([
    prisma.task.findMany({
      include: { company: true, assignedTo: true },
      orderBy: [{ dueAt: "asc" }, { createdAt: "desc" }]
    }),
    getCrmLookups()
  ]);

  return (
    <div className="grid gap-4 xl:grid-cols-[1fr_0.9fr]">
      <Card className="p-6">
        <div className="eyebrow">Tasks</div>
        <h1 className="mt-3 text-2xl font-semibold tracking-tight">Follow-ups, payment chases, renewal checks, and internal reminders</h1>
        <div className="mt-5 space-y-3">
          {tasks.map((task) => (
            <div className="rounded-2xl border border-border/70 p-4" key={task.id}>
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="font-semibold">{task.title}</p>
                  <p className="text-sm text-muted-foreground">{task.company?.name ?? "Internal"}</p>
                </div>
                <div className="text-right text-sm">
                  <p>{task.priority}</p>
                  <p className="text-muted-foreground">{task.dueAt ? formatDate(task.dueAt) : "No due date"}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Card className="p-6">
        <div className="eyebrow">New task</div>
        <form action={createTaskAction} className="mt-5 space-y-4">
          <input className="h-11 w-full rounded-2xl border border-border/70 bg-background/70 px-4 text-sm" name="title" placeholder="Task title" required />
          <textarea className="min-h-24 w-full rounded-2xl border border-border/70 bg-background/70 px-4 py-3 text-sm" name="description" placeholder="Task details" />
          <div className="grid gap-4 lg:grid-cols-2">
            <select className="h-11 rounded-2xl border border-border/70 bg-background/70 px-4 text-sm" defaultValue="MEDIUM" name="priority">
              <option value="LOW">Low</option>
              <option value="MEDIUM">Medium</option>
              <option value="HIGH">High</option>
              <option value="URGENT">Urgent</option>
            </select>
            <input className="h-11 rounded-2xl border border-border/70 bg-background/70 px-4 text-sm" name="dueAt" type="date" />
            <select className="h-11 rounded-2xl border border-border/70 bg-background/70 px-4 text-sm" name="assignedToUserId">
              <option value="">Assign to</option>
              {lookups.users.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.firstName} {user.lastName}
                </option>
              ))}
            </select>
            <select className="h-11 rounded-2xl border border-border/70 bg-background/70 px-4 text-sm" name="companyId">
              <option value="">Related company</option>
              {lookups.companies.map((company) => (
                <option key={company.id} value={company.id}>
                  {company.name}
                </option>
              ))}
            </select>
          </div>
          <button className="inline-flex h-11 items-center justify-center rounded-2xl bg-foreground px-4 text-sm font-semibold text-background" type="submit">
            Create task
          </button>
        </form>
      </Card>
    </div>
  );
}
