"use client";

import { useState } from "react";
import { useFieldArray, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { TaskChecklistPanel } from "./task-checklist";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { DatePicker } from "@/components/shared/date-picker";
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
import { TaskProjectPicker, useTaskAssigneeOptions } from "./task-project-picker";

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
  const lifecycle = useSheetLifecycle(onClose);
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
  const { fields, append, remove, move } = useFieldArray({ control, name: "checklists" });
  const [checklistDraft, setChecklistDraft] = useState("");
  const checklistValues = useWatch({control, name: "checklists"});
  const assigneeId = useWatch({ control, name: "assignee_id" });
  const type = useWatch({ control, name: "task_type" });
  const category = useWatch({ control, name: "task_category" });
  const dueDate = useWatch({ control, name: "due_date" });
  const assignees = useTaskAssigneeOptions(project, actorId);

  function selectProject(next: Project | null) {
    setProject(next);
    setValue("project_id", next?.id ?? "", { shouldValidate: true });
    setValue("assignee_id", actorId, { shouldValidate: true });
  }
  async function save(values: TaskFormValues) {
    if (checklistDraft.trim()) { toast.warning("Add the pending checklist item before saving."); return; }
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
      lifecycle.closeThen(() => onSaved(result.id));
    } catch {
      /* Preserve values for retry. */
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
      <SheetContent className="w-full border-l-2 border-border sm:max-w-lg">
        <SheetHeader>
          <SheetTitle>{task ? "Edit task" : "New task"}</SheetTitle>
          <SheetDescription>
            {task ? task.code : "Create a task and optional checklist in an active project."}
          </SheetDescription>
        </SheetHeader>
        <form noValidate onSubmit={handleSubmit(save)} className="flex min-h-0 flex-1 flex-col">
          <div className="min-h-0 flex-1 space-y-4 overflow-y-auto overscroll-contain p-4 sm:p-5">
            <section className="space-y-3 border-2 border-border bg-muted/30 p-3">
              <h3 className="text-sm font-bold"><span className="system-copy">Assignment</span></h3>
            <div className="space-y-2">
              <Label>Project</Label>
              {task || fixedProject ? (
                <p className="border-2 border-border bg-background p-3 text-sm">
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
            </section>
            <section className="space-y-3 border-2 border-border p-3">
              <h3 className="text-sm font-bold"><span className="system-copy">Task details</span></h3>
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
            </section>
            <section className="space-y-3 border-2 border-border bg-muted/30 p-3">
              <h3 className="text-sm font-bold"><span className="system-copy">Classification & schedule</span></h3>
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
              <DatePicker
                id="task-due-date"
                invalid={Boolean(errors.due_date)}
                value={dueDate ?? ""}
                disabled={pending}
                onChange={(value) =>
                  setValue("due_date", value || null, { shouldValidate: true })
                }
              />
              {errors.due_date && (
                <p role="alert" className="text-sm text-destructive">
                  {errors.due_date.message}
                </p>
              )}
            </div>
            </section>
            {!task && (
              <TaskChecklistPanel
                items={fields.map((field,index) => ({id:field.id,title:checklistValues?.[index]?.title ?? field.title,is_completed:false}))}
                editable busy={pending} canDelete
                onDraftChange={setChecklistDraft}
                onAdd={(title) => append({title})}
                onUpdate={(id,input) => { const index = fields.findIndex(field => field.id === id); if(index >= 0 && input.title !== undefined) setValue(`checklists.${index}.title`,input.title,{shouldValidate:true}); }}
                onRemove={(id) => remove(fields.findIndex(field => field.id === id))}
                onOrder={(ids) => { const current = fields.map(field => field.id); ids.forEach((id,index) => { const from = current.indexOf(id); if(from >= 0 && from !== index) { move(from,index); current.splice(index,0,current.splice(from,1)[0]); } }); }}
              />
            )}
            {mutation.isError && (
              <p role="alert" className="text-sm text-destructive">
                {getTaskError(mutation.error)}
              </p>
            )}
          </div>
          <SheetFooter>
            <Button type="button" variant="outline" disabled={pending} onClick={lifecycle.close}><span className="system-copy">
              Cancel
            </span></Button>
            <Button type="submit" disabled={pending}>
              {pending ? "Saving..." : task ? "Save changes" : "Create task"}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
