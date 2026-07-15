"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

type AssistantAction = {
  type: "restart_app";
  label: string;
  token: string;
};

export function OpsAssistant({
  selectedAppName,
  selectedAppKey
}: {
  selectedAppName: string;
  selectedAppKey: string;
}) {
  const [message, setMessage] = useState("");
  const [history, setHistory] = useState<Array<{ role: "user" | "assistant"; text: string }>>([]);
  const [action, setAction] = useState<AssistantAction | null>(null);
  const [isPending, startTransition] = useTransition();

  function ask(prompt: string) {
    startTransition(async () => {
      setHistory((current) => [...current, { role: "user", text: prompt }]);

      const response = await fetch("/api/assistant/ops", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: prompt,
          selectedAppName,
          selectedAppKey
        })
      });

      const payload = await response.json();
      setHistory((current) => [...current, { role: "assistant", text: payload.message }]);
      setAction(payload.action ?? null);
      setMessage("");
    });
  }

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!message.trim()) {
      return;
    }
    ask(message.trim());
  }

  async function confirmAction() {
    if (!action) {
      return;
    }

    const response = await fetch("/api/assistant/ops/confirm", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token: action.token })
    });

    const payload = await response.json();

    if (!response.ok) {
      toast.error(payload.error ?? "Unable to run that action.");
      return;
    }

    toast.success("Action completed.");
    setHistory((current) => [...current, { role: "assistant", text: payload.message }]);
    setAction(null);
  }

  return (
    <div className="panel p-6">
      <div className="mb-5 flex items-center justify-between gap-4">
        <div>
          <div className="eyebrow">AI chat</div>
          <h3 className="mt-3 text-xl font-semibold">Ops assistant</h3>
        </div>
        <span className="rounded-full bg-secondary px-3 py-1 text-xs font-semibold text-muted-foreground">Guided mode</span>
      </div>

      <div className="space-y-3">
        {[
          `Show me restart steps for ${selectedAppName}.`,
          `Inspect logs + suggest next action for ${selectedAppName}.`,
          `Run a health check for ${selectedAppName}.`
        ].map((prompt) => (
          <button
            className="w-full rounded-[1.2rem] border border-border/70 px-4 py-3 text-left text-sm hover:bg-card"
            key={prompt}
            onClick={() => ask(prompt)}
            type="button"
          >
            {prompt}
          </button>
        ))}
      </div>

      <div className="mt-5 space-y-3">
        {history.length ? (
          history.map((item, index) => (
            <div className={`rounded-[1.4rem] border p-4 ${item.role === "assistant" ? "bg-card" : "bg-accent/50"}`} key={`${item.role}-${index}`}>
              <p className="text-sm font-semibold">{item.role === "assistant" ? "Assistant" : "You"}</p>
              <p className="mt-2 text-sm leading-7">{item.text}</p>
            </div>
          ))
        ) : (
          <div className="rounded-[1.4rem] border border-border/70 bg-card p-4 text-sm leading-7 text-muted-foreground">
            Use the assistant to inspect logs, run health checks, or propose safe restart actions before touching a live app.
          </div>
        )}
      </div>

      {action ? (
        <Button className="mt-4 w-full" onClick={confirmAction}>
          {action.label}
        </Button>
      ) : null}

      <form className="mt-4 space-y-3" onSubmit={submit}>
        <Textarea
          onChange={(event) => setMessage(event.target.value)}
          placeholder={`Ask how to update, restart, inspect, or safely manage ${selectedAppName}...`}
          rows={4}
          value={message}
        />
        <Button className="w-full" disabled={isPending} type="submit">
          {isPending ? "Thinking..." : "Send"}
        </Button>
      </form>
    </div>
  );
}
