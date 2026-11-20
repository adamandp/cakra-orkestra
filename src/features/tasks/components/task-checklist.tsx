"use client";

import { useRef, useState, type ReactNode } from "react";
import {
  ArrowDownIcon,
  ArrowUpIcon,
  GripVerticalIcon,
  PencilIcon,
  PlusIcon,
  Trash2Icon,
} from "lucide-react";
import { motion, Reorder, useDragControls, useReducedMotion } from "motion/react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { TaskDetail, TaskChecklist } from "@/interface/task.interface";
import { getTaskError } from "../task.api";
import {
  useCreateTaskChecklist,
  useUpdateTaskChecklist,
  useDeleteTaskChecklist,
  useOrderTaskChecklists,
} from "../task.mutation";

function ChecklistRow({
  id,
  canDrag,
  onDragEnd,
  children,
}: {
  id: string;
  canDrag?: boolean;
  onDragEnd: () => void;
  children: ReactNode;
}) {
  const controls = useDragControls();
  const reducedMotion = useReducedMotion();
  return (
    <Reorder.Item
      value={id}
      dragListener={false}
      dragControls={controls}
      onDragEnd={onDragEnd}
      layout="position"
      transition={{
        layout: reducedMotion ? { duration: 0 } : { type: "spring", stiffness: 400, damping: 32 },
      }}
      whileDrag={{ zIndex: 10, boxShadow: "4px 5px 0 var(--shadow-color)" }}
      className="relative flex items-center gap-2 rounded-md border bg-card p-2"
    >
      {canDrag !== undefined && (
        <button
          type="button"
          aria-label="Drag to reorder checklist item"
          disabled={!canDrag}
          className="flex size-6 shrink-0 touch-none items-center justify-center cursor-grab text-muted-foreground active:cursor-grabbing disabled:cursor-default"
          onPointerDown={(event) => {
            if (canDrag) controls.start(event);
          }}
        >
          <GripVerticalIcon className="size-4" />
        </button>
      )}
      <div className="min-w-0 flex-1 space-y-2">{children}</div>
    </Reorder.Item>
  );
}

function PersistedChecklist({
  task,
  editable,
  busy = false,
  canDelete = false,
  canComplete = editable,
}: {
  task: TaskDetail;
  editable: boolean;
  busy?: boolean;
  canDelete?: boolean;
  canComplete?: boolean;
}) {
  const add = useCreateTaskChecklist(task.id);
  const update = useUpdateTaskChecklist(task.id);
  const remove = useDeleteTaskChecklist(task.id);
  const order = useOrderTaskChecklists(task.id);
  const pending = add.isPending || update.isPending || remove.isPending || order.isPending;
  return <ChecklistEditor items={[...task.checklists].sort((a,b) => a.sort_order-b.sort_order)} editable={editable} busy={busy || pending} canDelete={canDelete} canComplete={canComplete} status={task.task_status}
    onAdd={(title) => add.mutateAsync({title})}
    onUpdate={(id,input) => update.mutateAsync({itemId:id,input})}
    onRemove={(id) => remove.mutateAsync(id)}
    onOrder={(ids) => order.mutateAsync({item_ids:ids})} />;
}

type ChecklistItem = Pick<TaskChecklist, "id" | "title" | "is_completed">;
type EditorProps = {
  items: ChecklistItem[]; editable: boolean; busy?: boolean; canDelete?: boolean;
  canComplete?: boolean;
  status?: TaskDetail["task_status"];
  onAdd: (title: string) => unknown;
  onUpdate: (id: string, input: {title?: string; is_completed?: boolean}) => unknown;
  onRemove: (id: string) => unknown;
  onOrder: (ids: string[]) => unknown;
  onDraftChange?: (value: string) => void;
};
export function TaskChecklistPanel(props: Parameters<typeof PersistedChecklist>[0] | EditorProps) {
  return "task" in props ? <PersistedChecklist {...props} /> : <ChecklistEditor {...props} />;
}
function ChecklistEditor({items: sorted, editable, busy = false, canDelete = false, canComplete = editable, status, onAdd, onUpdate, onRemove, onOrder, onDraftChange}: EditorProps) {
  const [title, setTitle] = useState("");
  const [editing, setEditing] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [localOrder, setLocalOrder] = useState<string[] | null>(null);
  const dragOrder = useRef<string[] | null>(null);
  const items = localOrder ? localOrder.map(id => sorted.find(item => item.id === id)).filter((item): item is ChecklistItem => Boolean(item)) : sorted;
  const reduceProgressMotion = useReducedMotion();
  const completed = items.filter((item) => item.is_completed).length;
  const pending = busy;
  const disabled = busy || !editable;
  const completionHint =
    status === "OPEN"
      ? "Start the task before checking off items."
      : status === "BLOCKED"
        ? "Resume the task before checking off items."
        : status !== "PROGRESS"
          ? "Checklist completion is locked for this task."
          : null;

  async function run(action: () => unknown) {
    setError(null);
    try {
      await action();
      return true;
    } catch (error) {
      setError(getTaskError(error));
      return false;
    }
  }
  async function addItem() {
    if (disabled || editing) return;
    if (!title.trim()) { toast.warning("Enter a checklist item first."); return; }
    if (await run(() => onAdd(title.trim()))) { setTitle(""); onDraftChange?.(""); }
  }
  async function saveItem(item: ChecklistItem) {
    if (!draft.trim()) return;
    if (await run(() => onUpdate(item.id, {title: draft.trim()})))
      setEditing(null);
  }
  async function persistOrder(ids: string[]) {
    setLocalOrder(ids);
    await run(() => onOrder(ids));
    setLocalOrder(null);
  }

  function move(index: number, offset: number) {
    const next = index + offset;
    if (next < 0 || next >= items.length) return;
    const ids = items.map((item) => item.id);
    [ids[index], ids[next]] = [ids[next], ids[index]];
    void persistOrder(ids);
  }
  return (
    <section className="border-2 border-border bg-card">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b-2 border-border bg-muted/40 p-3">
        <h3 className="font-bold"><span className="system-copy">Checklists</span></h3>
        {status && <span className="text-xs tabular-nums text-muted-foreground">
          {completed}/{items.length} complete
        </span>}
      </div>
      <div className="space-y-3 p-3 pb-4">
        {status && items.length > 0 && (
          <div
            role="progressbar"
            aria-label="Checklist progress"
            aria-valuenow={completed}
            aria-valuemin={0}
            aria-valuemax={items.length}
            className="relative h-3 w-full overflow-hidden rounded-sm border border-border bg-muted"
          >
            <motion.div
              initial={false}
              animate={{ width: `${(completed / items.length) * 100}%` }}
              transition={
                reduceProgressMotion
                  ? { duration: 0 }
                  : { type: "spring", stiffness: 110, damping: 19, mass: 0.8 }
              }
              className="relative h-full overflow-hidden bg-emerald-600 dark:bg-emerald-400 motion-reduce:!transform-none"
            >
              <motion.div
                key={completed}
                initial={{ x: "-100%", opacity: 0.65 }}
                animate={{ x: "200%", opacity: 0 }}
                transition={{ duration: 0.65, ease: "easeOut" }}
                className="absolute inset-y-0 left-0 w-1/2 skew-x-[-20deg] bg-gradient-to-r from-transparent via-white/65 to-transparent motion-reduce:hidden"
              />
            </motion.div>
          </div>
        )}
        {!items.length && <p className="text-sm text-muted-foreground"><span className="system-copy">No checklist items.</span></p>}
        <Reorder.Group
          axis="y"
          values={items.map((item) => item.id)}
          onReorder={(ids) => {
            dragOrder.current = ids;
            setLocalOrder(ids);
          }}
          className="space-y-2"
        >
          {items.map((item, index) => (
            <ChecklistRow
              key={item.id}
              id={item.id}
              canDrag={editable ? !disabled && !editing : undefined}
              onDragEnd={() => {
                const ids = dragOrder.current;
                dragOrder.current = null;
                if (ids) void persistOrder(ids);
              }}
            >
              {editing === item.id && editable ? (
                <div
                  className="space-y-2"

                >
                  <Input
                    aria-label="Edit checklist title"
                    value={draft}
                    disabled={disabled}
                    onChange={(event) => setDraft(event.target.value)}
                  />
                  <div className="flex justify-end gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={busy || pending}
                      onClick={() => setEditing(null)}
                    >
                      Cancel
                    </Button>
                    <Button type="button" onClick={() => void saveItem(item)} size="sm" disabled={disabled || !draft.trim()}>
                      Save
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-wrap items-center gap-2">
                  <label
                    className={`flex min-w-0 flex-1 items-center gap-2 text-sm ${completionHint ? "cursor-not-allowed" : ""}`}
                    onClick={(event) => {
                      if (status && completionHint && canComplete) {
                        event.preventDefault();
                        toast.info(completionHint, { id: "checklist-completion-hint" });
                      }
                    }}
                  >
                    {status && <input
                      type="checkbox"
                      className="size-4 shrink-0 accent-primary disabled:pointer-events-none"
                      checked={item.is_completed}
                      disabled={!canComplete || disabled || Boolean(editing) || status !== "PROGRESS"}
                      onChange={(event) => {
                        const checked = event.target.checked;
                        void run(() =>
                          onUpdate(item.id, {is_completed: checked}),
                        );
                      }}
                    />}
                    <span
                      className={`min-w-0 break-words ${item.is_completed ? "text-muted-foreground line-through" : ""}`}
                    >
                      {item.title}
                    </span>
                  </label>
                  {editable && (
                    <div className="flex gap-1">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        aria-label={`Move ${item.title} up`}
                        disabled={disabled || Boolean(editing) || index === 0}
                        onClick={() => move(index, -1)}
                      >
                        <ArrowUpIcon />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        aria-label={`Move ${item.title} down`}
                        disabled={disabled || Boolean(editing) || index === items.length - 1}
                        onClick={() => move(index, 1)}
                      >
                        <ArrowDownIcon />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        aria-label={`Edit ${item.title}`}
                        disabled={disabled || Boolean(editing)}
                        onClick={() => {
                          setEditing(item.id);
                          setDraft(item.title);
                          setError(null);
                        }}
                      >
                        <PencilIcon />
                      </Button>
                      {canDelete && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-sm"
                          aria-label={`Remove ${item.title}`}
                          disabled={disabled || Boolean(editing)}
                          onClick={() => void run(() => onRemove(item.id))}
                        >
                          <Trash2Icon />
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              )}
            </ChecklistRow>
          ))}
        </Reorder.Group>
        {editable && (
          <div className="flex gap-2">
            <Input
              aria-label="New checklist title"
              className="h-[45px]"
              placeholder="Add checklist item..."
              value={title}
              disabled={disabled || Boolean(editing)}
              onChange={(event) => { setTitle(event.target.value); onDraftChange?.(event.target.value); }}
              onKeyDown={(event) => { if (event.key === "Enter") { event.preventDefault(); void addItem(); } }}
            />
            <Button
              type="button"
              onClick={() => void addItem()}
              size="icon"
              aria-label="Add checklist item"
              disabled={disabled || Boolean(editing) || !title.trim()}
              className="size-10 shrink-0 mr-1 disabled:opacity-100"
              data-retain-disabled-shadow
            >
              <PlusIcon />
            </Button>
          </div>
        )}
        {error && (
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
        )}
      </div>
    </section>
  );
}
