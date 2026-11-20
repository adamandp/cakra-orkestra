"use client";

import { useState } from "react";
import { useFieldArray, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { PlusIcon, XIcon, FolderIcon, FileTextIcon, GitCommitHorizontalIcon, ListChecksIcon } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { DateTimePicker } from "@/components/shared/date-time-picker";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  useSheetLifecycle,
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetFooter,
  SheetTitle,
} from "@/components/ui/sheet";
import type { Project } from "@/interface/project.interface";
import type { Changelog, UpdateChangelogInput } from "@/interface/changelog.interface";
import { useCreateChangelog, useUpdateChangelog } from "../changelog.mutation";
import { getChangelogError } from "../changelog.api";
import { changelogFormSchema, type ChangelogFormValues } from "../changelog.schema";
import { toLocalDateTime } from "../changelog.constants";
import { ChangelogProjectPicker } from "./changelog-project-picker";

export function ChangelogFormSheet({
  entry,
  initialProject,
  onClose,
  onSaved,
}: {
  entry?: Changelog;
  initialProject?: Project;
  onClose: () => void;
  onSaved: (id: string) => void;
}) {
  const [project, setProject] = useState<Project | null>(initialProject ?? null);
  const [initialReleaseTime] = useState(() => toLocalDateTime(entry?.released_at ?? new Date()));
  const createMutation = useCreateChangelog();
  const updateMutation = useUpdateChangelog(entry?.id ?? "");
  const mutation = entry ? updateMutation : createMutation;
  const lifecycle = useSheetLifecycle(onClose);
  const pending = mutation.isPending;
  const {
    control,
    register,
    watch,
    setValue,
    handleSubmit,
    formState: { errors },
  } = useForm<ChangelogFormValues>({
    resolver: zodResolver(changelogFormSchema),
    defaultValues: {
      project_id: entry?.project_id ?? initialProject?.id ?? "",
      version: entry?.version ?? "",
      description: entry?.description ?? "",
      commit_url: entry?.commit_url ?? "",
      released_at: initialReleaseTime,
      changes: entry?.changes.map(({ description }) => ({ description })) ?? [],
    },
  });
  const { fields, append, remove } = useFieldArray({ control, name: "changes" });

  const hasEmptyChange = (watch("changes") ?? []).some((change) => !change.description.trim());

  function selectProject(next: Project | null) {
    setProject(next);
    setValue("project_id", next?.id ?? "", { shouldValidate: true });
  }

  async function save(values: ChangelogFormValues) {
    const description = values.description || null;
    const commit_url = values.commit_url || null;
    const released_at = new Date(values.released_at).toISOString();
    try {
      if (!entry) {
        const result = await createMutation.mutateAsync({
          project_id: values.project_id,
          version: values.version,
          description,
          commit_url,
          released_at,
          changes: values.changes,
        });
        toast.success("Changelog created");
        lifecycle.closeThen(() => onSaved(result.id));
        return;
      }
      const input: UpdateChangelogInput = {};
      if (values.version !== entry.version) input.version = values.version;
      if (description !== entry.description) input.description = description;
      if (commit_url !== entry.commit_url) input.commit_url = commit_url;
      if (values.released_at !== initialReleaseTime) input.released_at = released_at;
      if (
        values.changes.length !== entry.changes.length ||
        values.changes.some(
          (change, index) => change.description !== entry.changes[index]?.description,
        )
      )
        input.changes = values.changes;
      if (Object.keys(input).length === 0) {
        lifecycle.closeThen(() => onSaved(entry.id));
        return;
      }
      const result = await updateMutation.mutateAsync(input);
      toast.success("Changelog updated");
      lifecycle.closeThen(() => onSaved(result.id));
    } catch {
      /* Keep the form and show the mutation error. */
    }
  }

  return (
    <Sheet
      open={lifecycle.open}
      onOpenChangeComplete={lifecycle.onOpenChangeComplete}
      onOpenChange={(open) => {
        if (!open && !pending) lifecycle.close();
      }}
    >
      <SheetContent className="w-full border-l-2 border-border gap-0 sm:max-w-xl">
        <SheetHeader>
          <SheetTitle>{entry ? "Edit release" : "New release"}</SheetTitle>
          <SheetDescription>
            {entry ? entry.version : "Document a project release and its changes."}
          </SheetDescription>
        </SheetHeader>
        <form noValidate onSubmit={handleSubmit(save)} className="flex min-h-0 flex-1 flex-col">
          <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-4">
            <section className="space-y-4 rounded-md border-2 border-border bg-card p-4 shadow-neo-sm">
              <h3 className="flex items-center gap-2 font-bold"><FolderIcon className="size-4" /> Release overview</h3>
              <div className="space-y-2">
              <Label>Project</Label>
              {entry ? (
                <p className="rounded-md border p-3 text-sm">
                  {entry.project.code} — {entry.project.name}
                </p>
              ) : (
                <ChangelogProjectPicker
                  selected={project}
                  onChange={selectProject}
                  disabled={pending}
                />
              )}
              {errors.project_id && (
                <p role="alert" className="text-sm text-destructive">
                  {errors.project_id.message}
                </p>
              )}
            </div>
            <div className="grid min-w-0 gap-3 sm:grid-cols-2">
            <div className="min-w-0 space-y-2">
              <Label htmlFor="release-version">Version</Label>
              <Input
                id="release-version"
                placeholder="v2.4.0"
                maxLength={30}
                disabled={pending}
                aria-invalid={Boolean(errors.version)}
                {...register("version")}
              />
              {errors.version && (
                <p role="alert" className="text-sm text-destructive">
                  {errors.version.message}
                </p>
              )}
            </div>
            <div className="min-w-0 space-y-2">
              <Label htmlFor="release-date">Release date and time</Label>
              <DateTimePicker id="release-date" value={watch("released_at")} disabled={pending} invalid={Boolean(errors.released_at)} onChange={value => setValue("released_at", value, { shouldDirty: true, shouldValidate: true })} />
              <p className="text-xs text-muted-foreground"><span className="system-copy">Your local time zone</span></p>
              {errors.released_at && (
                <p role="alert" className="text-sm text-destructive">
                  {errors.released_at.message}
                </p>
              )}
            </div>
            </div>
            </section>
            <section className="space-y-3 rounded-md border-2 border-border p-4">
              <h3 className="flex items-center gap-2 font-bold"><FileTextIcon className="size-4" /> Release summary <span className="ml-auto text-xs font-normal text-muted-foreground"><span className="system-copy">Optional</span></span></h3>
              <textarea
                id="release-description"
                aria-label="Release summary"
                placeholder="Summarize this release..."
                rows={4}
                disabled={pending}
                className="block w-full resize-y rounded-md border-2 border-border bg-background p-3 text-sm focus-visible:outline-2 focus-visible:outline-ring"
                {...register("description")}
              />
            </section>
            <section className="space-y-3 rounded-md border-2 border-border p-4">
              <div className="flex items-center justify-between">
                <h3 className="flex items-center gap-2 font-bold"><ListChecksIcon className="size-4" /> What's changed</h3>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={pending}
                  aria-disabled={pending}
                  className={hasEmptyChange ? "cursor-not-allowed opacity-60" : undefined}
                  onClick={() => { if (hasEmptyChange) { toast.error("Fill in all existing changes before adding a new one."); return; } append({ description: "" }); }}
                >
                  <PlusIcon /> Add change
                </Button>
              </div>
              {fields.map((field, index) => (
                <div key={field.id} className="space-y-1">
                  <div className="flex items-start gap-2">
                    <span className="pt-2 text-xs font-mono text-muted-foreground">{String(index + 1).padStart(2, "0")}</span>
                    <textarea rows={2} className="min-w-0 flex-1 resize-y rounded-md border-2 border-border bg-background p-2 text-sm" placeholder="Describe the change..."
                      aria-label={`Change ${index + 1}`}
                      disabled={pending}
                      aria-invalid={Boolean(errors.changes?.[index]?.description)}
                      {...register(`changes.${index}.description`)}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      aria-label={`Remove change ${index + 1}`}
                      disabled={pending}
                      onClick={() => remove(index)}
                    >
                      <XIcon />
                    </Button>
                  </div>
                  {errors.changes?.[index]?.description && (
                    <p role="alert" className="text-sm text-destructive">
                      {errors.changes[index]?.description?.message}
                    </p>
                  )}
                </div>
              ))}
              {!fields.length && (
                <p className="rounded-md border border-dashed border-border p-4 text-center text-xs text-muted-foreground"><span className="system-copy">No change items added.</span></p>
              )}
            </section>
            <section className="space-y-3 rounded-md border-2 border-border p-4">
              <h3 className="flex items-center gap-2 font-bold"><GitCommitHorizontalIcon className="size-4" /> Source reference <span className="ml-auto text-xs font-normal text-muted-foreground"><span className="system-copy">Optional</span></span></h3>
              <Label htmlFor="release-commit">Commit URL</Label>
              <Input
                id="release-commit"
                type="url"
                placeholder="https://github.com/org/repo/commit/abc123"
                disabled={pending}
                aria-invalid={Boolean(errors.commit_url)}
                {...register("commit_url")}
              />
              {errors.commit_url && (
                <p role="alert" className="text-sm text-destructive">
                  {errors.commit_url.message}
                </p>
              )}
            </section>
            {mutation.isError && (
              <p role="alert" className="text-sm text-destructive">
                {getChangelogError(mutation.error)}
              </p>
            )}
          </div>
          <SheetFooter>
            <Button type="button" variant="outline" disabled={pending} onClick={lifecycle.close}><span className="system-copy">
              Cancel
            </span></Button>
            <Button type="submit" disabled={pending}>
              {pending ? "Saving..." : entry ? "Save changes" : "Create release"}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
