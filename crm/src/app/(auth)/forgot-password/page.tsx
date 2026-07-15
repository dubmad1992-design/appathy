import { forgotPasswordAction } from "@/server/actions/auth";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export default async function ForgotPasswordPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const params = await searchParams;

  return (
    <main className="shell flex min-h-screen items-center justify-center py-16">
      <Card className="w-full max-w-xl p-8">
        <div className="eyebrow">Password reset</div>
        <h1 className="mt-4 text-3xl font-semibold tracking-tight">Request a reset link</h1>
        <p className="mt-2 text-sm text-muted-foreground">We’ll generate a secure reset link and send it through the configured email provider.</p>
        {params.sent ? <p className="mt-4 rounded-2xl bg-success/10 px-4 py-3 text-sm text-success">If the account exists, a reset email has been queued.</p> : null}
        <form action={forgotPasswordAction} className="mt-6 space-y-4">
          <label className="block space-y-2 text-sm">
            <span className="font-medium">Work email</span>
            <Input name="email" required type="email" />
          </label>
          <button className="inline-flex h-12 w-full items-center justify-center rounded-2xl bg-foreground px-5 text-sm font-semibold text-background" type="submit">
            Send reset link
          </button>
        </form>
      </Card>
    </main>
  );
}
