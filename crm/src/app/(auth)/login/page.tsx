import { loginAction } from "@/server/actions/auth";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export default async function LoginPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const params = await searchParams;
  const error = params.error;
  const reset = params.reset;

  return (
    <main className="shell flex min-h-screen items-center justify-center py-16">
      <div className="grid w-full max-w-5xl gap-6 lg:grid-cols-[0.95fr_1.05fr]">
        <Card className="hidden p-10 lg:block">
          <div className="eyebrow">Appathy CRM</div>
          <h1 className="mt-5 text-5xl font-semibold tracking-tight">Own renewals, billing, and customer follow-through from one polished workspace.</h1>
          <p className="mt-5 max-w-xl text-base leading-8 text-muted-foreground">
            Built for service businesses managing hosting, websites, maintenance plans, retainers, and recurring billing communications.
          </p>
        </Card>
        <Card className="p-8 lg:p-10">
          <div className="mb-8">
            <div className="eyebrow">Secure sign in</div>
            <h2 className="mt-4 text-3xl font-semibold tracking-tight">Welcome back</h2>
            <p className="mt-2 text-sm text-muted-foreground">Sign in with your staff account to manage customers, billing, renewals, and follow-up work.</p>
          </div>

          {error ? <p className="mb-4 rounded-2xl bg-danger/10 px-4 py-3 text-sm text-danger">We couldn&apos;t sign you in with those details.</p> : null}
          {reset ? <p className="mb-4 rounded-2xl bg-success/10 px-4 py-3 text-sm text-success">Password reset complete. You can sign in now.</p> : null}

          <form action={loginAction} className="space-y-4">
            <label className="block space-y-2 text-sm">
              <span className="font-medium">Email</span>
              <Input name="email" placeholder="you@company.com" required type="email" />
            </label>
            <label className="block space-y-2 text-sm">
              <span className="font-medium">Password</span>
              <Input name="password" required type="password" />
            </label>
            <button className="mt-3 inline-flex h-12 w-full items-center justify-center rounded-2xl bg-foreground px-5 text-sm font-semibold text-background" type="submit">
              Sign in
            </button>
          </form>

          <div className="mt-6 flex items-center justify-between text-sm">
            <a className="text-primary" href="/forgot-password">
              Forgot password?
            </a>
            <span className="text-muted-foreground">Need access? Ask an administrator to create your account.</span>
          </div>
        </Card>
      </div>
    </main>
  );
}
