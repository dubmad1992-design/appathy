import { resetPasswordAction } from "@/server/actions/auth";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export default async function ResetPasswordPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const params = await searchParams;
  const token = typeof params.token === "string" ? params.token : "";

  return (
    <main className="shell flex min-h-screen items-center justify-center py-16">
      <Card className="w-full max-w-xl p-8">
        <div className="eyebrow">Reset password</div>
        <h1 className="mt-4 text-3xl font-semibold tracking-tight">Choose a new password</h1>
        {params.error ? <p className="mt-4 rounded-2xl bg-danger/10 px-4 py-3 text-sm text-danger">The reset link is invalid or has expired.</p> : null}
        <form action={resetPasswordAction} className="mt-6 space-y-4">
          <input name="token" type="hidden" value={token} />
          <label className="block space-y-2 text-sm">
            <span className="font-medium">New password</span>
            <Input name="password" required type="password" />
          </label>
          <label className="block space-y-2 text-sm">
            <span className="font-medium">Confirm password</span>
            <Input name="confirmPassword" required type="password" />
          </label>
          <button className="inline-flex h-12 w-full items-center justify-center rounded-2xl bg-foreground px-5 text-sm font-semibold text-background" type="submit">
            Update password
          </button>
        </form>
      </Card>
    </main>
  );
}
