"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { formatFileSize } from "@/lib/utils";

type CustomerDocument = {
  id: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  storagePath: string;
};

type CustomerDocumentsPanelProps = {
  companyId: string;
  documents: CustomerDocument[];
};

export function CustomerDocumentsPanel({ companyId, documents }: CustomerDocumentsPanelProps) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSuccess(null);

    const formData = new FormData(event.currentTarget);
    formData.set("scope", "COMPANY");
    formData.set("companyId", companyId);

    const response = await fetch("/api/documents", {
      method: "POST",
      body: formData
    });

    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      setError(typeof payload.error === "string" ? payload.error : "Upload failed.");
      return;
    }

    setSuccess("Document uploaded.");
    formRef.current?.reset();
    startTransition(() => {
      router.refresh();
    });
  }

  return (
    <div className="space-y-4">
      <form className="rounded-2xl border border-dashed border-border/70 p-4" onSubmit={onSubmit} ref={formRef}>
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="font-medium">Upload a customer file</p>
            <p className="mt-1 text-sm text-muted-foreground">Attach contracts, purchase orders, or supporting files up to 10 MB.</p>
          </div>
          <input className="text-sm" name="file" required type="file" />
        </div>
        {error ? <p className="mt-3 rounded-2xl bg-danger/10 px-4 py-3 text-sm text-danger">{error}</p> : null}
        {success ? <p className="mt-3 rounded-2xl bg-success/10 px-4 py-3 text-sm text-success">{success}</p> : null}
        <button className="mt-4 inline-flex h-10 items-center justify-center rounded-2xl bg-foreground px-4 text-sm font-semibold text-background disabled:opacity-60" disabled={isPending} type="submit">
          {isPending ? "Uploading..." : "Upload document"}
        </button>
      </form>

      <div className="space-y-3">
        {documents.length ? (
          documents.map((document) => (
            <a className="block rounded-2xl border border-border/70 p-4 hover:border-primary" href={document.storagePath} key={document.id} target="_blank">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-medium">{document.fileName}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{document.mimeType}</p>
                </div>
                <p className="text-xs text-muted-foreground">{formatFileSize(document.sizeBytes)}</p>
              </div>
            </a>
          ))
        ) : (
          <p className="text-sm text-muted-foreground">No documents attached yet.</p>
        )}
      </div>
    </div>
  );
}
