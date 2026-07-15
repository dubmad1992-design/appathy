"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const interests = ["Website refresh", "Existing system integration", "Form digitisation", "Internal dashboard", "Ongoing support"];

export function ContactForm() {
  const [isPending, startTransition] = useTransition();
  const [form, setForm] = useState({
    name: "",
    email: "",
    company: "",
    interestType: interests[0],
    message: ""
  });

  function update<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    startTransition(async () => {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form)
      });

      const payload = await response.json();

      if (!response.ok) {
        toast.error(payload.error ?? "Unable to send your project enquiry.");
        return;
      }

      toast.success("Your project enquiry has been sent.");
      setForm({
        name: "",
        email: "",
        company: "",
        interestType: interests[0],
        message: ""
      });
    });
  }

  return (
    <form className="space-y-5" data-testid="contact-form" onSubmit={submit}>
      <div className="grid gap-5 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="name">Name</Label>
          <Input data-testid="contact-name" id="name" onChange={(event) => update("name", event.target.value)} required value={form.name} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input data-testid="contact-email" id="email" onChange={(event) => update("email", event.target.value)} required type="email" value={form.email} />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="company">Company or business</Label>
        <Input data-testid="contact-company" id="company" onChange={(event) => update("company", event.target.value)} value={form.company} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="interestType">Interest type</Label>
        <select
          className="flex h-11 w-full rounded-[1.15rem] border border-input bg-background/88 px-4 py-2 text-sm shadow-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/15"
          data-testid="contact-interest"
          id="interestType"
          onChange={(event) => update("interestType", event.target.value)}
          value={form.interestType}
        >
          {interests.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="message">Message</Label>
        <Textarea data-testid="contact-message" id="message" onChange={(event) => update("message", event.target.value)} required rows={6} value={form.message} />
      </div>

      <Button className="w-full" data-testid="contact-submit" disabled={isPending} size="lg" type="submit">
        {isPending ? "Sending..." : "Send project enquiry"}
      </Button>
    </form>
  );
}
