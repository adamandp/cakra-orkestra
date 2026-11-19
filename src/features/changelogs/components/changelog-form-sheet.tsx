"use client";

import { useState } from "react";
import { useFieldArray, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { PlusIcon, XIcon } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
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
  const pending = mutation.isPending;
  const {
    control,
    register,
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
        onSaved(result.id);
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
        onSaved(entry.id);
        return;
      }
      const result = await updateMutation.mutateAsync(input);
      toast.success("Changelog updated");
      onSaved(result.id);
    } catch {
      /* Keep the form and show the mutation error. */
    }
  }

  return (
    <Sheet
      open
      onOpenChange={(open) => {
        if (!open && !pending) onClose();
      }}
    >
      <SheetContent className="w-full border-l-2 border-border sm:max-w-lg">
        <SheetHeader>
          <SheetTitle>{entry ? "Edit release" : "New release"}</SheetTitle>
          <SheetDescription>
            {entry ? entry.version : "Document a project release and its changes."}
          </SheetDescription>
        </SheetHeader>
        <form noValidate onSubmit={handleSubmit(save)} className="flex min-h-0 flex-1 flex-col">
          <div className="flex-1 space-y-4 overflow-y-auto p-4">
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
            <div className="space-y-2">
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
            <div className="space-y-2">
              <Label htmlFor="release-description">Description (optional)</Label>
              <textarea
                id="release-description"
                rows={4}
                disabled={pending}
                className="w-full rounded-md border-2 border-border bg-background p-3 text-sm focus-visible:outline-2 focus-visible:outline-ring"
                {...register("description")}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="release-commit">Commit URL (optional)</Label>
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
            </div>
            <div className="space-y-2">
              <Label htmlFor="release-date">Release date and time</Label>
              <Input
                id="release-date"
                type="datetime-local"
                disabled={pending}
                aria-invalid={Boolean(errors.released_at)}
                {...register("released_at")}
              />
              <p className="text-xs text-muted-foreground">Your local time zone</p>
              {errors.released_at && (
                <p role="alert" className="text-sm text-destructive">
                  {errors.released_at.message}
                </p>
              )}
            </div>
            <section className="space-y-2 border-t pt-3">
              <div className="flex items-center justify-between">
                <h3 className="font-bold">Changes</h3>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={pending}
                  onClick={() => append({ description: "" })}
                >
                  <PlusIcon /> Add change
                </Button>
              </div>
              {fields.map((field, index) => (
                <div key={field.id} className="space-y-1">
                  <div className="flex gap-2">
                    <Input
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
                <p className="text-xs text-muted-foreground">No change items added.</p>
              )}
            </section>
            {mutation.isError && (
              <p role="alert" className="text-sm text-destructive">
                {getChangelogError(mutation.error)}
              </p>
            )}
          </div>
          <div className="flex justify-end gap-3 border-t p-4">
            <Button type="button" variant="outline" disabled={pending} onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={pending}>
              {pending ? "Saving..." : entry ? "Save changes" : "Create release"}
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}
