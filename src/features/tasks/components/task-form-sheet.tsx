"use client";

import { useState } from "react";
import { useFieldArray, useForm, useWatch } from "react-hook-form";
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
import type { TaskDetail } from "@/interface/task.interface";
import { useCreateTask, useUpdateTask } from "../task.mutation";
import { getTaskError } from "../task.api";
import {
  taskFormSchema,
  taskTypeSchema,
  taskCategorySchema,
  type TaskFormValues,
} from "../task.schema";
import { taskTypeLabels, taskCategoryLabels } from "../task.constants";
import { TaskSelect } from "./task-select";
import { TaskProjectPicker, taskAssigneeOptions } from "./task-project-picker";

export function TaskFormSheet({
  task,
  fixedProject,
  actorId,
  isAdmin,
  onClose,
  onSaved,
}: {
  task?: TaskDetail;
  fixedProject?: Project;
  actorId: string;
  isAdmin: boolean;
  onClose: () => void;
  onSaved: (id: string) => void;
}) {
  const [project, setProject] = useState<Project | null>(fixedProject ?? null);
  const createMutation = useCreateTask();
  const updateMutation = useUpdateTask(task?.id ?? "");
  const mutation = task ? updateMutation : createMutation;
  const pending = mutation.isPending;
  const {
    control,
    register,
    setValue,
    handleSubmit,
    formState: { errors },
  } = useForm<TaskFormValues>({
    resolver: zodResolver(taskFormSchema),
    defaultValues: {
      title: task?.title ?? "",
      description: task?.description ?? "",
      project_id: task?.project_id ?? fixedProject?.id ?? "",
      assignee_id: task?.assignee_id ?? actorId,
      task_type: task?.task_type ?? "REGULAR",
      task_category: task?.task_category ?? "CLIENT",
      due_date: task?.due_date ?? null,
      checklists: [],
    },
  });
  const { fields, append, remove } = useFieldArray({ control, name: "checklists" });
  const assigneeId = useWatch({ control, name: "assignee_id" });
  const type = useWatch({ control, name: "task_type" });
  const category = useWatch({ control, name: "task_category" });
  const dueDate = useWatch({ control, name: "due_date" });
  const assignees = taskAssigneeOptions(project, actorId);

  function selectProject(next: Project | null) {
    setProject(next);
    setValue("project_id", next?.id ?? "", { shouldValidate: true });
    setValue("assignee_id", actorId, { shouldValidate: true });
  }
  async function save(values: TaskFormValues) {
    const fields = {
      title: values.title,
      description: values.description,
      task_type: values.task_type,
      task_category: values.task_category,
      due_date: values.due_date,
    };
    try {
      const result = task
        ? await updateMutation.mutateAsync(fields)
        : await createMutation.mutateAsync({
            ...fields,
            project_id: values.project_id,
            assignee_id: values.assignee_id,
            checklists: values.checklists,
          });
      toast.success(task ? "Task updated" : "Task created");
      onSaved(result.id);
    } catch {
      /* Preserve values for retry. */
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
          <SheetTitle>{task ? "Edit task" : "New task"}</SheetTitle>
          <SheetDescription>
            {task ? task.code : "Create a task and optional checklist in an active project."}
          </SheetDescription>
        </SheetHeader>
        <form noValidate onSubmit={handleSubmit(save)} className="flex min-h-0 flex-1 flex-col">
          <div className="flex-1 space-y-4 overflow-y-auto p-4">
            <div className="space-y-2">
              <Label>Project</Label>
              {task || fixedProject ? (
                <p className="rounded-md border p-3 text-sm">
                  {task?.project.name ?? fixedProject?.name}
                </p>
              ) : (
                <TaskProjectPicker
                  activeOnly
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
            {!task && (
              <div className="space-y-2">
                <Label htmlFor="task-assignee">Assignee</Label>
                {isAdmin && project ? (
                  <TaskSelect
                    id="task-assignee"
                    label="Assignee"
                    value={assigneeId}
                    options={assignees}
                    disabled={pending}
                    onChange={(value) => setValue("assignee_id", value, { shouldValidate: true })}
                  />
                ) : (
                  <p className="text-sm text-muted-foreground">
                    {isAdmin ? "Select a project first." : "Assigned to you"}
                  </p>
                )}
                {errors.assignee_id && (
                  <p role="alert" className="text-sm text-destructive">
                    {errors.assignee_id.message}
                  </p>
                )}
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="task-title">Title</Label>
              <Input
                id="task-title"
                maxLength={255}
                disabled={pending}
                aria-invalid={Boolean(errors.title)}
                {...register("title")}
              />
              {errors.title && (
                <p role="alert" className="text-sm text-destructive">
                  {errors.title.message}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="task-description">Description</Label>
              <textarea
                id="task-description"
                rows={4}
                disabled={pending}
                aria-invalid={Boolean(errors.description)}
                className="w-full rounded-md border-2 border-border bg-background p-3 text-sm focus-visible:outline-2 focus-visible:outline-ring"
                {...register("description")}
              />
              {errors.description && (
                <p role="alert" className="text-sm text-destructive">
                  {errors.description.message}
                </p>
              )}
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="task-type">Type</Label>
                <TaskSelect
                  id="task-type"
                  label="Type"
                  value={type}
                  options={taskTypeSchema.options.map((value) => ({
                    value,
                    label: taskTypeLabels[value],
                  }))}
                  disabled={pending}
                  onChange={(value) =>
                    setValue("task_type", taskTypeSchema.parse(value), { shouldValidate: true })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="task-category">Category</Label>
                <TaskSelect
                  id="task-category"
                  label="Category"
                  value={category}
                  options={taskCategorySchema.options.map((value) => ({
                    value,
                    label: taskCategoryLabels[value],
                  }))}
                  disabled={pending}
                  onChange={(value) =>
                    setValue("task_category", taskCategorySchema.parse(value), {
                      shouldValidate: true,
                    })
                  }
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="task-due-date">Due date (optional)</Label>
              <Input
                id="task-due-date"
                type="date"
                value={dueDate ?? ""}
                disabled={pending}
                onChange={(event) =>
                  setValue("due_date", event.target.value || null, { shouldValidate: true })
                }
              />
              {errors.due_date && (
                <p role="alert" className="text-sm text-destructive">
                  {errors.due_date.message}
                </p>
              )}
            </div>
            {!task && (
              <section className="space-y-2 border-t pt-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold">Checklists (optional)</h3>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={pending}
                    onClick={() => append({ title: "" })}
                  >
                    <PlusIcon /> Add item
                  </Button>
                </div>
                {fields.map((field, index) => (
                  <div key={field.id} className="space-y-1">
                    <div className="flex gap-2">
                      <Input
                        aria-label={`Checklist ${index + 1}`}
                        disabled={pending}
                        {...register(`checklists.${index}.title`)}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        aria-label={`Remove checklist ${index + 1}`}
                        disabled={pending}
                        onClick={() => remove(index)}
                      >
                        <XIcon />
                      </Button>
                    </div>
                    {errors.checklists?.[index]?.title && (
                      <p role="alert" className="text-sm text-destructive">
                        {errors.checklists[index]?.title?.message}
                      </p>
                    )}
                  </div>
                ))}
                {!fields.length && (
                  <p className="text-xs text-muted-foreground">
                    You can add checklist items later.
                  </p>
                )}
              </section>
            )}
            {mutation.isError && (
              <p role="alert" className="text-sm text-destructive">
                {getTaskError(mutation.error)}
              </p>
            )}
          </div>
          <div className="flex justify-end gap-3 border-t p-4">
            <Button type="button" variant="outline" disabled={pending} onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={pending}>
              {pending ? "Saving..." : task ? "Save changes" : "Create task"}
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}
