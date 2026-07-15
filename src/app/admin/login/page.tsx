"use client";

import { Suspense, useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowRight, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

function AdminLoginInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [remember, setRemember] = useState(true);

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const email = String(formData.get("email") ?? "").trim();
    const password = String(formData.get("password") ?? "");

    if (!email || !password) {
      toast.error("Enter your email and password to continue.");
      return;
    }

    startTransition(async () => {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          password,
          remember
        })
      });

      if (!response.ok) {
        const payload = await response.json();
        toast.error(payload.error ?? "Unable to sign in.");
        return;
      }

      router.push(searchParams.get("next") ?? "/admin/dashboard");
      router.refresh();
    });
  }

  return (
    <main className="shell flex min-h-screen items-center justify-center py-10">
      <div className="grid w-full max-w-6xl gap-8 lg:grid-cols-[1.05fr_0.95fr]">
        <div className="panel soft-grid hidden min-h-[620px] overflow-hidden p-10 lg:flex lg:flex-col lg:justify-between">
          <div className="space-y-6">
            <div className="inline-flex w-fit items-center gap-2 rounded-full border border-primary/20 bg-card/75 px-4 py-2 text-sm font-medium text-primary">
              <ShieldCheck className="h-4 w-4" />
              Secure control layer
            </div>
            <div className="space-y-4">
              <h1 className="text-5xl font-semibold tracking-tight text-balance">Manage the rest of the apps on this VPS from one place.</h1>
              <p className="max-w-xl text-lg leading-8 text-muted-foreground">
                Appathy keeps the public site simple and the backend practical: app control, content updates, enquiries, users, and guided ops in one admin.
              </p>
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {[
              ["Control", "See live app status, paths, and runtime details in one view."],
              ["Content", "Update homepage copy, services, FAQ, and testimonials without noise."],
              ["Ops", "Inspect logs, health, and safe restart actions through guided prompts."]
            ].map(([title, copy]) => (
              <div className="rounded-3xl border border-border/70 bg-card/74 p-5" key={title}>
                <p className="font-semibold">{title}</p>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">{copy}</p>
              </div>
            ))}
          </div>
        </div>

        <Card className="mx-auto w-full max-w-xl p-8 lg:p-10">
          <div className="mb-8 space-y-2">
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-primary">Appathy admin</p>
            <h2 className="text-3xl font-semibold tracking-tight">Sign in</h2>
            <p className="text-muted-foreground">Private access to apps, content, enquiries, users, and platform settings.</p>
          </div>

          <form className="space-y-5" data-testid="admin-login-form" onSubmit={submit}>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                autoCapitalize="none"
                autoComplete="username"
                autoCorrect="off"
                data-testid="admin-login-email"
                id="email"
                inputMode="email"
                name="email"
                placeholder="admin@appathy.uk"
                spellCheck={false}
                type="email"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input autoComplete="current-password" data-testid="admin-login-password" id="password" name="password" placeholder="Enter your password" type="password" />
            </div>

            <label className="flex items-center gap-3 rounded-[1.35rem] border border-border/80 bg-secondary/40 px-4 py-3 text-sm">
              <input
                checked={remember}
                className="h-4 w-4"
                name="remember"
                onChange={(event) => setRemember(event.target.checked)}
                type="checkbox"
              />
              Keep this session signed in
            </label>

            <Button className="w-full" data-testid="admin-login-submit" disabled={isPending} size="lg" type="submit">
              {isPending ? "Signing in..." : "Continue to dashboard"}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </form>
        </Card>
      </div>
    </main>
  );
}

export default function AdminLoginPage() {
  return (
    <Suspense fallback={<main className="min-h-screen bg-background" />}>
      <AdminLoginInner />
    </Suspense>
  );
}
