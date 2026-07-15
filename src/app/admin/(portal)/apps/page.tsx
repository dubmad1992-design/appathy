import { OpsAssistant } from "@/components/admin/ops-assistant";
import { Card } from "@/components/ui/card";
import { saveAppAction } from "@/app/admin/(portal)/actions";
import { appStatusTone } from "@/lib/constants";
import { getManagedAppsOverview } from "@/lib/vps-control";

export default async function AdminAppsPage() {
  const apps = await getManagedAppsOverview();
  const selected = apps[0];

  return (
    <div className="space-y-6">
      <Card className="p-8">
        <div className="space-y-4">
          <div className="eyebrow">Control</div>
          <h1 className="text-4xl font-semibold tracking-tight">VPS control</h1>
          <p className="max-w-2xl text-sm leading-7 text-muted-foreground">
            Keep the live apps on this server visible and manageable from one place. The left side stays operational, the right side stays descriptive.
          </p>
        </div>
      </Card>

      <div className="grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
        <div className="space-y-4">
          {apps.map((app) => (
            <Card className="p-5" key={app.id}>
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-lg font-semibold">{app.name}</p>
                  <p className="text-sm text-muted-foreground">{app.runtime ?? app.category}</p>
                </div>
                <span className={`rounded-full px-3 py-1 text-xs font-semibold ${appStatusTone[app.status]}`}>{app.runtimeStatus}</span>
              </div>
              <div className="mt-5 grid gap-3 text-sm text-muted-foreground sm:grid-cols-2">
                <div>Process: {app.processName ?? "Not set"}</div>
                <div>Port: {app.port ?? "Not set"}</div>
                <div>Uptime: {app.uptime}</div>
                <div>Restarts: {app.restartCount}</div>
                <div>Memory: {app.memoryMb ? `${app.memoryMb} MB` : "Unknown"}</div>
                <div>PID: {app.pid ?? "Unknown"}</div>
              </div>
            </Card>
          ))}
        </div>

        <div className="space-y-4">
          <Card className="p-6">
            <div className="grid gap-4 xl:grid-cols-[0.95fr_1.05fr]">
              <div className="space-y-3">
                <div className="eyebrow">Selected app</div>
                <h2 className="text-2xl font-semibold">{selected.name}</h2>
                <p className="text-sm leading-7 text-muted-foreground">{selected.longDescription}</p>
                <div className="grid gap-3 text-sm text-muted-foreground">
                  <div>Public: {selected.liveUrl ?? "Not set"}</div>
                  <div>Admin: {selected.adminUrl ?? "Not set"}</div>
                  <div>Path: {selected.deployPath ?? "Not set"}</div>
                  <div>Health URL: {selected.healthUrl ?? "Not set"}</div>
                </div>
              </div>
              <OpsAssistant selectedAppKey={selected.slug} selectedAppName={selected.name} />
            </div>
          </Card>

          <Card className="p-6">
            <div className="mb-5">
              <h2 className="text-xl font-semibold">Registry editor</h2>
              <p className="mt-2 text-sm text-muted-foreground">Keep the public registry and the operational details aligned for each app.</p>
            </div>
            <div className="space-y-6">
              {apps.map((app) => (
                <form action={saveAppAction} className="rounded-[1.6rem] border border-border/70 p-5" key={app.id}>
                  <input name="id" type="hidden" value={app.id} />
                  <input name="slug" type="hidden" value={app.slug} />
                  <input name="category" type="hidden" value={app.category} />
                  <input name="runtime" type="hidden" value={app.runtime ?? ""} />
                  <input name="port" type="hidden" value={app.port ?? ""} />
                  <input name="processName" type="hidden" value={app.processName ?? ""} />
                  <input name="deployPath" type="hidden" value={app.deployPath ?? ""} />
                  <input name="healthUrl" type="hidden" value={app.healthUrl ?? ""} />
                  <input name="screenshots" type="hidden" value={Array.isArray(app.screenshotUrls) ? app.screenshotUrls.join("\n") : ""} />
                  <input name="logoUrl" type="hidden" value={app.logoUrl ?? ""} />
                  <input name="sortOrder" type="hidden" value={app.sortOrder} />
                  <input name="versionNotes" type="hidden" value={app.versionNotes ?? ""} />

                  <div className="grid gap-4 lg:grid-cols-2">
                    <label className="space-y-2 text-sm">
                      <span className="font-medium">Name</span>
                      <input className="flex h-11 w-full rounded-[1.15rem] border border-input bg-background/88 px-4" defaultValue={app.name} name="name" />
                    </label>
                    <label className="space-y-2 text-sm">
                      <span className="font-medium">Status</span>
                      <select className="flex h-11 w-full rounded-[1.15rem] border border-input bg-background/88 px-4" defaultValue={app.status} name="status">
                        <option value="LIVE">LIVE</option>
                        <option value="IN_DEVELOPMENT">IN_DEVELOPMENT</option>
                        <option value="PAUSED">PAUSED</option>
                        <option value="ARCHIVED">ARCHIVED</option>
                      </select>
                    </label>
                  </div>

                  <label className="mt-4 block space-y-2 text-sm">
                    <span className="font-medium">Short description</span>
                    <textarea
                      className="min-h-24 w-full rounded-[1.15rem] border border-input bg-background/88 px-4 py-3"
                      defaultValue={app.shortDescription}
                      name="shortDescription"
                    />
                  </label>

                  <label className="mt-4 block space-y-2 text-sm">
                    <span className="font-medium">Long description</span>
                    <textarea
                      className="min-h-32 w-full rounded-[1.15rem] border border-input bg-background/88 px-4 py-3"
                      defaultValue={app.longDescription}
                      name="longDescription"
                    />
                  </label>

                  <div className="mt-4 grid gap-4 lg:grid-cols-2">
                    <label className="space-y-2 text-sm">
                      <span className="font-medium">Live URL</span>
                      <input className="flex h-11 w-full rounded-[1.15rem] border border-input bg-background/88 px-4" defaultValue={app.liveUrl ?? ""} name="liveUrl" />
                    </label>
                    <label className="space-y-2 text-sm">
                      <span className="font-medium">Admin URL</span>
                      <input className="flex h-11 w-full rounded-[1.15rem] border border-input bg-background/88 px-4" defaultValue={app.adminUrl ?? ""} name="adminUrl" />
                    </label>
                  </div>

                  <label className="mt-4 block space-y-2 text-sm">
                    <span className="font-medium">Repository URL</span>
                    <input className="flex h-11 w-full rounded-[1.15rem] border border-input bg-background/88 px-4" defaultValue={app.repositoryUrl ?? ""} name="repositoryUrl" />
                  </label>

                  <label className="mt-4 block space-y-2 text-sm">
                    <span className="font-medium">Internal notes</span>
                    <textarea
                      className="min-h-24 w-full rounded-[1.15rem] border border-input bg-background/88 px-4 py-3"
                      defaultValue={app.internalNotes ?? ""}
                      name="internalNotes"
                    />
                  </label>

                  <div className="mt-4 flex flex-wrap gap-4 text-sm">
                    <label className="inline-flex items-center gap-2">
                      <input defaultChecked={app.featured} name="featured" type="checkbox" />
                      Featured
                    </label>
                    <label className="inline-flex items-center gap-2">
                      <input defaultChecked={app.isPublic} name="isPublic" type="checkbox" />
                      Public
                    </label>
                  </div>

                  <button className="mt-5 rounded-full bg-foreground px-5 py-2 text-sm font-semibold text-background" type="submit">
                    Save {app.name}
                  </button>
                </form>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
