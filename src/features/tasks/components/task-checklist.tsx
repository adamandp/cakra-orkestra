"use client";

import { useState } from "react";
import { ArrowDownIcon, ArrowUpIcon, PencilIcon, PlusIcon, Trash2Icon } from "lucide-react";
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

export function TaskChecklistPanel({ task, editable }: { task: TaskDetail; editable: boolean }) {
  const add = useCreateTaskChecklist(task.id);
  const update = useUpdateTaskChecklist(task.id);
  const remove = useDeleteTaskChecklist(task.id);
  const order = useOrderTaskChecklists(task.id);
  const [title, setTitle] = useState("");
  const [editing, setEditing] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [error, setError] = useState<string | null>(null);
  const items = [...task.checklists].sort((a, b) => a.sort_order - b.sort_order);
  const completed = items.filter((item) => item.is_completed).length;
  const pending = add.isPending || update.isPending || remove.isPending || order.isPending;
  const disabled = pending || !editable;

  async function run(action: () => Promise<unknown>) {
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
    if (!title.trim()) return;
    if (await run(() => add.mutateAsync({ title: title.trim() }))) setTitle("");
  }
  async function saveItem(item: TaskChecklist) {
    if (!draft.trim()) return;
    if (await run(() => update.mutateAsync({ itemId: item.id, input: { title: draft.trim() } })))
      setEditing(null);
  }
  function move(index: number, offset: number) {
    const next = index + offset;
    if (next < 0 || next >= items.length) return;
    const ids = items.map((item) => item.id);
    [ids[index], ids[next]] = [ids[next], ids[index]];
    void run(() => order.mutateAsync({ item_ids: ids }));
  }
  return (
    <section className="space-y-3 border-t pt-4">
      <div className="flex items-center justify-between">
        <h3 className="font-bold">Checklists</h3>
        <span className="text-xs tabular-nums text-muted-foreground">
          {completed}/{items.length} complete
        </span>
      </div>
      {items.length > 0 && (
        <progress
          aria-label="Checklist progress"
          value={completed}
          max={items.length}
          className="h-2 w-full accent-primary"
        />
      )}
      {!items.length && <p className="text-sm text-muted-foreground">No checklist items.</p>}
      <div className="space-y-2">
        {items.map((item, index) => (
          <div key={item.id} className="space-y-2 rounded-md border p-2">
            {editing === item.id && editable ? (
              <form
                className="space-y-2"
                onSubmit={(event) => {
                  event.preventDefault();
                  void saveItem(item);
                }}
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
                    disabled={pending}
                    onClick={() => setEditing(null)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" size="sm" disabled={disabled || !draft.trim()}>
                    Save
                  </Button>
                </div>
              </form>
            ) : (
              <div className="flex flex-wrap items-start gap-2">
                <label className="flex min-w-32 flex-1 items-start gap-2 text-sm">
                  <input
                    type="checkbox"
                    className="mt-1 accent-primary"
                    checked={item.is_completed}
                    disabled={disabled || Boolean(editing)}
                    onChange={(event) => {
                      const checked = event.target.checked;
                      void run(() =>
                        update.mutateAsync({ itemId: item.id, input: { is_completed: checked } }),
                      );
                    }}
                  />
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
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      aria-label={`Remove ${item.title}`}
                      disabled={disabled || Boolean(editing)}
                      onClick={() => void run(() => remove.mutateAsync(item.id))}
                    >
                      <Trash2Icon />
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
      {editable && (
        <form
          className="flex gap-2"
          onSubmit={(event) => {
            event.preventDefault();
            void addItem();
          }}
        >
          <Input
            aria-label="New checklist title"
            placeholder="Add checklist item..."
            value={title}
            disabled={disabled || Boolean(editing)}
            onChange={(event) => setTitle(event.target.value)}
          />
          <Button
            type="submit"
            size="icon"
            aria-label="Add checklist item"
            disabled={disabled || Boolean(editing) || !title.trim()}
          >
            <PlusIcon />
          </Button>
        </form>
      )}
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
    </section>
  );
}
