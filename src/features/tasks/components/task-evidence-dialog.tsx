"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { CreateTaskLinkInput } from "@/interface/task.interface";
import {
  createTaskLinkSchema,
  presignTaskEvidenceSchema,
  confirmTaskEvidenceSchema,
} from "../task.schema";

export function TaskEvidenceDialog({
  busy,
  onCancel,
  onLink,
  onFile,
}: {
  busy: boolean;
  onCancel: () => void;
  onLink: (input: CreateTaskLinkInput) => Promise<boolean>;
  onFile: (file: File, title?: string) => Promise<boolean>;
}) {
  const [type, setType] = useState<"LINK" | "FILE">("LINK");
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  async function submit() {
    const label = title.trim() || undefined;
    setError(null);
    if (type === "LINK") {
      const parsed = createTaskLinkSchema.safeParse({ title: label, url });
      if (!parsed.success) {
        setError(parsed.error.issues[0].message);
        return;
      }
      await onLink(parsed.data);
      return;
    }
    if (!file) {
      setError("Select a file");
      return;
    }
    const metadata = presignTaskEvidenceSchema.safeParse({
      file_name: file.name,
      mime_type: file.type || "application/octet-stream",
      file_size: file.size,
    });
    const titleResult = confirmTaskEvidenceSchema.shape.title.safeParse(label);
    if (!metadata.success) {
      setError(metadata.error.issues[0].message);
      return;
    }
    if (!titleResult.success) {
      setError(titleResult.error.issues[0].message);
      return;
    }
    await onFile(file, titleResult.data);
  }
  return (
    <form
      noValidate
      className="space-y-4 border-t border-dashed border-border pt-4"
      onSubmit={(event) => {
        event.preventDefault();
        if (!busy) void submit();
      }}
    >
      <h4 className="text-sm font-semibold"><span className="system-copy">New attachment</span></h4>
      <div role="group" aria-label="Evidence type" className="flex gap-2">
        <Button
          type="button"
          variant={type === "LINK" ? "default" : "outline"}
          aria-pressed={type === "LINK"}
          disabled={busy}
          onClick={() => {
            setType("LINK");
            setError(null);
          }}
        >
          Link
        </Button>
        <Button
          type="button"
          variant={type === "FILE" ? "default" : "outline"}
          aria-pressed={type === "FILE"}
          disabled={busy}
          onClick={() => {
            setType("FILE");
            setFile(null);
            setError(null);
          }}
        >
          File
        </Button>
      </div>
      <div className="space-y-2">
        <Label htmlFor="task-evidence-title">Title (optional)</Label>
        <Input
          id="task-evidence-title"
          value={title}
          maxLength={255}
          disabled={busy}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="Session API test results"
        />
      </div>
      {type === "LINK" ? (
        <div className="space-y-2">
          <Label htmlFor="task-evidence-url">Link</Label>
          <Input
            id="task-evidence-url"
            type="url"
            maxLength={2048}
            value={url}
            disabled={busy}
            onChange={(event) => setUrl(event.target.value)}
            placeholder="https://github.com/..."
          />
        </div>
      ) : (
        <div className="space-y-2">
          <Label htmlFor="task-evidence-file">File</Label>
          <Input
            id="task-evidence-file"
            type="file"
            disabled={busy}
            onChange={(event) => setFile(event.target.files?.[0] ?? null)}
          />
          <p className="text-xs text-muted-foreground"><span className="system-copy">Maximum 20 MiB per file. Any file type.</span></p>
        </div>
      )}
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
      <div className="flex flex-wrap justify-end gap-3 border-t border-border pt-4 pb-2 pr-1">
        <Button type="button" variant="outline" disabled={busy} onClick={onCancel}><span className="system-copy">
          Cancel
        </span></Button>
        <Button type="submit" disabled={busy || (type === "LINK" ? !url.trim() : !file)}>
          {busy ? "Saving..." : "Add evidence"}
        </Button>
      </div>
    </form>
  );
}
