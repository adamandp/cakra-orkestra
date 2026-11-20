"use client";
import { useState, type ReactNode } from "react";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  rectSortingStrategy,
  useSortable,
  arrayMove,
  sortableKeyboardCoordinates,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  PlusIcon,
  PinIcon,
  PencilIcon,
  Trash2Icon,
  MessageCircleIcon,
  SearchIcon,
  GripVerticalIcon,
  HeartIcon,
  LaughIcon,
} from "lucide-react";
import { Popover } from "@base-ui/react/popover";
import { Dialog } from "@base-ui/react/dialog";
import { AlertDialog } from "@base-ui/react/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/providers/auth-provider";
import { axiosInstance } from "@/lib/axios";
import { noteColors, noteEmojis, type NoteColor, type WallNote } from "@/interface/wall.interface";
import { getWallNotes, wallPath } from "../wall.api";
import { toast } from "sonner";
const colors: Record<NoteColor, string> = {
  yellow: "bg-[#fef08a] dark:bg-[#f3d66c]",
  pink: "bg-[#fbcfe8] dark:bg-[#eaa2bb]",
  green: "bg-[#bbf7d0] dark:bg-[#9bdfb5]",
  blue: "bg-[#bfdbfe] dark:bg-[#91c4f4]",
  purple: "bg-[#ddd6fe] dark:bg-[#baa9ef]",
  orange: "bg-[#fed7aa] dark:bg-[#efb77f]",
};
const blank = { title: "", content: "", color: "yellow" as NoteColor };
const modal =
  "fixed left-1/2 top-1/2 z-[71] max-h-[85dvh] w-[calc(100%-2rem)] max-w-lg -translate-x-1/2 -translate-y-1/2 overflow-y-auto border-2 border-border bg-card p-5 shadow-neo-button";
function SortableNote({ note, children }: { note: WallNote; children: ReactNode }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
    isOver,
  } = useSortable({ id: note.id });
  return (
    <article
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 50 : undefined,
      }}
      className={
        "relative min-w-0 " +
        (isDragging
          ? "scale-[1.025] rotate-2 shadow-[10px_10px_0_#202020] dark:shadow-[10px_10px_0_var(--shadow-color)] ring-2 ring-black"
          : isOver
            ? "shadow-[4px_4px_0_#202020] dark:shadow-neo-button outline-2 outline-dashed outline-offset-4 outline-current"
            : "shadow-[4px_4px_0_#202020] dark:shadow-neo-button")
      }
    >
      <div
        className={
          colors[note.color] +
          " flex items-center justify-end border-2 border-b-0 border-[#202020] text-[#202020] dark:border-[#101218] dark:text-[#141820]"
        }
      >
        <button
          type="button"
          ref={setActivatorNodeRef}
          {...attributes}
          {...listeners}
          className="flex size-6 touch-none select-none cursor-grab items-center justify-center text-black/50 hover:bg-black/5 hover:text-black/80 dark:text-black/60 dark:hover:bg-black/10 dark:hover:text-black active:cursor-grabbing"
          aria-label={"Drag " + note.title}
        >
          <GripVerticalIcon className="size-4" />
        </button>
      </div>
      <div
        className={
          colors[note.color] +
          " min-w-0 border-2 border-t-0 border-[#202020] p-4 text-[#202020] dark:border-[#101218] dark:text-[#141820]"
        }
      >
        {children}
      </div>
    </article>
  );
}
export function TeamWall() {
  const { user } = useAuth();
  const client = useQueryClient();
  const query = useQuery({
    queryKey: ["wall", user?.id],
    queryFn: ({ signal }) => getWallNotes(signal),
    enabled: !!user,
    refetchInterval: 10000,
  });
  const [filter, setFilter] = useState("All Notes");
  const [search, setSearch] = useState("");
  const [editor, setEditor] = useState<string | null>(null);
  const [draft, setDraft] = useState(blank);
  const [detail, setDetail] = useState<string | null>(null);
  const [comment, setComment] = useState("");
  const [deletion, setDeletion] = useState<{ path: string; label: string } | null>(null);
  const [order, setOrder] = useState<string[]>([]);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const mutation = useMutation({
    mutationFn: async (v: {
      method: "post" | "patch" | "delete";
      path: string;
      body?: unknown;
      message?: string;
      done?: () => void;
    }) => {
      await axiosInstance.request({ method: v.method, url: v.path, data: v.body });
    },
    onSuccess: async (_, v) => {
      await client.invalidateQueries({ queryKey: ["wall"] });
      await client.invalidateQueries({ queryKey: ["activity-logs"] });
      v.done?.();
      if (v.message) toast.success(v.message);
    },
    onError: () => toast.error("Unable to update Team Wall"),
  });
  const run = (
    method: "post" | "patch" | "delete",
    path: string,
    body?: unknown,
    message?: string,
    done?: () => void,
  ) => mutation.mutate({ method, path, body, message, done });
  const items = query.data ?? [];
  const selected = items.find((n) => n.id === detail);
  const notes = items
    .filter(
      (n) =>
        (filter !== "My Notes" || n.author_id === user?.id) &&
        (filter !== "Pinned" || n.pinned) &&
        [n.title, n.content, n.author_name].some((v) =>
          v.toLowerCase().includes(search.toLowerCase()),
        ),
    )
    .sort(
      (a, b) =>
        Number(b.pinned) - Number(a.pinned) ||
        (order.indexOf(a.id) < 0 ? 999 : order.indexOf(a.id)) -
          (order.indexOf(b.id) < 0 ? 999 : order.indexOf(b.id)) ||
        b.created_at.localeCompare(a.created_at),
    );
  const handleDragEnd = ({ active, over }: DragEndEvent) => {
    if (!over || active.id === over.id) return;
    const from = notes.findIndex((n) => n.id === active.id),
      to = notes.findIndex((n) => n.id === over.id);
    if (from < 0 || to < 0) return;
    if (notes[from].pinned !== notes[to].pinned) {
      toast.info("Pinned notes stay at the top");
      return;
    }
    const visible = new Set(notes.map((n) => n.id));
    setOrder([
      ...arrayMove(notes, from, to).map((n) => n.id),
      ...order.filter((id) => !visible.has(id)),
    ]);
  };
  const manage = (n: WallNote) => n.author_id === user?.id || user?.role === "ADMIN";
  const edit = (n?: WallNote) => {
    setDraft(n ? { title: n.title, content: n.content, color: n.color } : blank);
    setEditor(n?.id ?? "new");
  };
  const react = (n: WallNote, emoji: string) => {
    const mine = n.reactions.find((r) => r.user_id === user?.id);
    run(
      mine?.emoji === emoji ? "delete" : "post",
      wallPath + "/" + n.id + "/reactions" + (mine?.emoji === emoji ? "/me" : ""),
      { emoji },
    );
  };
  return (
    <div className="min-w-0 space-y-5 p-4 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black"><span className="system-copy">Team Wall</span></h1>
          <p className="text-sm text-muted-foreground"><span className="system-copy">
            A little space for big ideas, reminders, and team wins.
          </span></p>
        </div>
        <Button onClick={() => edit()}>
          <PlusIcon /> Add Note
        </Button>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex flex-wrap gap-2">
          {["All Notes", "My Notes", "Pinned"].map((f) => (
            <Button
              key={f}
              variant={f === filter ? "default" : "outline"}
              size="sm"
              onClick={() => setFilter(f)}
            >
              {f}
            </Button>
          ))}
        </div>
        <div className="relative min-w-0 flex-1 sm:ml-auto sm:max-w-xs">
          <SearchIcon className="absolute left-3 top-1/2 size-4 -translate-y-1/2" />
          <Input
            className="pl-9"
            placeholder="Search notes..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>
      <div
        className="min-h-[60vh] border-2 border-border p-3 sm:p-5"
        style={{
          backgroundImage:
            "radial-gradient(color-mix(in srgb, currentColor 15%, transparent) 1px, transparent 1px)",
          backgroundSize: "18px 18px",
        }}
      >
        {query.isPending ? (
          <p><span className="system-copy">Loading notes...</span></p>
        ) : query.isError ? (
          <Button onClick={() => query.refetch()}>Retry loading notes</Button>
        ) : !notes.length ? (
          <p className="p-8 text-center text-muted-foreground"><span className="system-copy">
            No notes found. Add something to the wall!
          </span></p>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext items={notes.map((n) => n.id)} strategy={rectSortingStrategy}>
              <div className="grid grid-cols-1 items-start gap-5 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
                {notes.map((n) => (
                  <SortableNote key={n.id} note={n}>
                    <div className="mb-3 flex items-center justify-between gap-2">
                      <span className="flex items-center gap-1 text-xs font-bold uppercase tracking-wide">
                        {n.pinned ? <PinIcon className="size-4" /> : null}
                        {n.pinned ? "Pinned" : "Note"}
                      </span>
                      <div className="flex items-center gap-2">
                        {manage(n) && (
                          <button
                            title="Pin / unpin"
                            aria-label="Pin or unpin note"
                            disabled={mutation.isPending}
                            onClick={() =>
                              run(
                                "patch",
                                wallPath + "/" + n.id + "/pin",
                                undefined,
                                n.pinned ? "Note unpinned" : "Note pinned",
                              )
                            }
                          >
                            <PinIcon className="size-4" />
                          </button>
                        )}
                        {n.author_id === user?.id && (
                          <button aria-label="Edit note" onClick={() => edit(n)}>
                            <PencilIcon className="size-4" />
                          </button>
                        )}
                        {manage(n) && (
                          <button
                            aria-label="Delete note"
                            onClick={() =>
                              setDeletion({ path: wallPath + "/" + n.id, label: "note" })
                            }
                          >
                            <Trash2Icon className="size-4" />
                          </button>
                        )}
                      </div>
                    </div>
                    <button
                      className="block w-full text-left"
                      onClick={() => {
                        setDetail(n.id);
                        setComment("");
                      }}
                    >
                      <h2 className="break-words text-lg font-black">{n.title}</h2>
                      <p className="mt-2 min-h-16 whitespace-pre-wrap break-words text-sm">
                        {n.content}
                      </p>
                    </button>
                    <div className="mt-4 border-t border-current/25 pt-3">
                      <p className="break-words text-xs font-bold">{n.author_name}</p>
                      <p className="text-xs opacity-70">
                        {new Date(n.created_at).toLocaleDateString()}
                      </p>
                      <div className="mt-3 flex flex-wrap items-center justify-end gap-1">
                        <button
                          type="button"
                          disabled={mutation.isPending}
                          aria-label="Like note"
                          aria-pressed={(n.likes ?? []).includes(user?.id ?? "")}
                          onClick={() => run("patch", wallPath + "/" + n.id + "/like")}
                          className={
                            "inline-flex items-center gap-1 rounded px-2 py-1.5 text-xs font-bold hover:bg-black/10 dark:hover:bg-black/10 " +
                            ((n.likes ?? []).includes(user?.id ?? "")
                              ? "bg-black/15 dark:bg-black/15"
                              : "")
                          }
                        >
                          <HeartIcon
                            className={
                              "size-4 " +
                              ((n.likes ?? []).includes(user?.id ?? "")
                                ? "fill-red-500 text-red-600"
                                : "")
                            }
                          />
                          {n.likes?.length ?? 0}
                        </button>
                        <Popover.Root>
                          <Popover.Trigger
                            aria-label="Add reaction"
                            disabled={mutation.isPending}
                            className="flex items-center gap-1 rounded px-2 py-1.5 hover:bg-black/10 dark:hover:bg-black/10"
                          >
                            <LaughIcon className="size-4" />
                          </Popover.Trigger>
                          <Popover.Portal>
                            <Popover.Positioner sideOffset={8} className="z-[60]">
                              <Popover.Popup className="w-52 border-2 border-border bg-popover p-2 text-popover-foreground shadow-neo-button">
                                <div className="grid grid-cols-6 gap-1">
                                  {noteEmojis.map((emoji) => (
                                    <Popover.Close
                                      key={emoji}
                                      onClick={() => react(n, emoji)}
                                      className="rounded p-1 text-lg hover:bg-muted"
                                      aria-label={"React " + emoji}
                                    >
                                      {emoji}
                                    </Popover.Close>
                                  ))}
                                </div>
                                <form
                                  className="mt-2 flex gap-1 border-t pt-2"
                                  onSubmit={(e) => {
                                    e.preventDefault();
                                    const value = String(
                                      new FormData(e.currentTarget).get("emoji") ?? "",
                                    ).trim();
                                    if (value) react(n, value);
                                    e.currentTarget.reset();
                                  }}
                                >
                                  <Input
                                    name="emoji"
                                    placeholder="Any emoji"
                                    aria-label="Custom emoji"
                                    maxLength={32}
                                    className="h-8 min-w-0"
                                  />
                                  <Button size="sm"><span className="system-copy">Add</span></Button>
                                </form>
                              </Popover.Popup>
                            </Popover.Positioner>
                          </Popover.Portal>
                        </Popover.Root>
                        {[...new Set(n.reactions.map((r) => r.emoji))].map((emoji) => (
                          <button
                            key={emoji}
                            disabled={mutation.isPending}
                            onClick={() => react(n, emoji)}
                            aria-label={"React " + emoji}
                            aria-pressed={n.reactions.some(
                              (r) => r.user_id === user?.id && r.emoji === emoji,
                            )}
                            className={
                              "rounded-full border border-current/20 px-1.5 py-0.5 text-xs hover:bg-white/50 dark:hover:bg-white/50 " +
                              (n.reactions.some((r) => r.user_id === user?.id && r.emoji === emoji)
                                ? "bg-white dark:bg-black/15"
                                : "")
                            }
                          >
                            {emoji} {n.reactions.filter((r) => r.emoji === emoji).length}
                          </button>
                        ))}
                        <button
                          className="flex items-center gap-1 rounded px-2 py-1.5 text-xs font-bold hover:bg-black/10 dark:hover:bg-black/10"
                          onClick={() => {
                            setDetail(n.id);
                            setComment("");
                          }}
                        >
                          <MessageCircleIcon className="size-4" />
                          {n.comments.length}
                        </button>
                      </div>
                    </div>
                  </SortableNote>
                ))}
              </div>
            </SortableContext>
          </DndContext>
        )}
      </div>
      <Dialog.Root
        open={editor !== null}
        onOpenChange={(open) => {
          if (!open && !mutation.isPending) setEditor(null);
        }}
      >
        <Dialog.Portal>
          <Dialog.Backdrop className="fixed inset-0 z-[70] bg-black/50" />
          <Dialog.Popup className={modal}>
            <Dialog.Title className="mb-4 text-xl font-black">
              {editor === "new" ? "Add Note" : "Edit Note"}
            </Dialog.Title>
            <form
              className="space-y-3"
              onSubmit={(e) => {
                e.preventDefault();
                run(
                  editor === "new" ? "post" : "patch",
                  wallPath + (editor === "new" ? "" : "/" + editor),
                  draft,
                  "Note saved",
                  () => setEditor(null),
                );
              }}
            >
              <label className="block text-sm font-bold">
                Title
                <Input
                  required
                  maxLength={80}
                  value={draft.title}
                  onChange={(e) => setDraft({ ...draft, title: e.target.value })}
                />
              </label>
              <label className="block text-sm font-bold">
                Content
                <textarea
                  required
                  maxLength={1500}
                  rows={5}
                  className="mt-1 w-full border-2 border-border bg-background p-3"
                  value={draft.content}
                  onChange={(e) => setDraft({ ...draft, content: e.target.value })}
                />
              </label>
              <p className="text-sm font-bold"><span className="system-copy">Note color</span></p>
              <div className="flex flex-wrap gap-2">
                {noteColors.map((c) => (
                  <button
                    type="button"
                    key={c}
                    aria-label={c}
                    aria-pressed={draft.color === c}
                    onClick={() => setDraft({ ...draft, color: c })}
                    className={
                      colors[c] +
                      " size-9 border-2 border-black " +
                      (c === draft.color ? "ring-2 ring-offset-2 ring-ring" : "")
                    }
                  />
                ))}
              </div>
              <div className="flex justify-end gap-2">
                <Dialog.Close render={<Button variant="outline" type="button" />}>
                  Cancel
                </Dialog.Close>
                <Button
                  type="submit"
                  disabled={mutation.isPending || !draft.title.trim() || !draft.content.trim()}
                ><span className="system-copy">
                  Save Note
                </span></Button>
              </div>
            </form>
          </Dialog.Popup>
        </Dialog.Portal>
      </Dialog.Root>
      <Dialog.Root
        open={!!selected}
        onOpenChange={(open) => {
          if (!open) setDetail(null);
        }}
      >
        <Dialog.Portal>
          <Dialog.Backdrop className="fixed inset-0 z-[70] bg-black/50" />
          <Dialog.Popup className={modal}>
            {selected && (
              <>
                <Dialog.Title className="text-xl font-black break-words">
                  {selected.title}
                </Dialog.Title>
                <p className="mt-2 whitespace-pre-wrap break-words text-sm">{selected.content}</p>
                <p className="my-4 border-b-2 border-border pb-3 text-xs text-muted-foreground">
                  {selected.author_name}
                </p>
                <h3 className="font-bold">Comments ({selected.comments.length})</h3>
                <div className="my-3 space-y-2">
                  {selected.comments.map((c) => (
                    <div key={c.id} className="border border-border p-2">
                      <div className="flex justify-between gap-2">
                        <span className="text-xs font-bold">{c.author_name}</span>
                        {(c.author_id === user?.id || user?.role === "ADMIN") && (
                          <button
                            aria-label="Delete comment"
                            onClick={() =>
                              setDeletion({ path: "/wall/comments/" + c.id, label: "comment" })
                            }
                          >
                            <Trash2Icon className="size-4" />
                          </button>
                        )}
                      </div>
                      <p className="break-words text-sm">{c.content}</p>
                    </div>
                  ))}
                </div>
                <form
                  className="flex gap-2"
                  onSubmit={(e) => {
                    e.preventDefault();
                    run(
                      "post",
                      wallPath + "/" + selected.id + "/comments",
                      { content: comment },
                      "Comment added",
                      () => setComment(""),
                    );
                  }}
                >
                  <Input
                    aria-label="Comment"
                    placeholder="Write a comment..."
                    maxLength={500}
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                  />
                  <Button disabled={!comment.trim() || mutation.isPending}><span className="system-copy">Post</span></Button>
                </form>
                <Dialog.Close render={<Button variant="outline" className="mt-4" />}>
                  Close
                </Dialog.Close>
              </>
            )}
          </Dialog.Popup>
        </Dialog.Portal>
      </Dialog.Root>
      <AlertDialog.Root
        open={!!deletion}
        onOpenChange={(open) => {
          if (!open && !mutation.isPending) setDeletion(null);
        }}
      >
        <AlertDialog.Portal>
          <AlertDialog.Backdrop className="fixed inset-0 z-[80] bg-black/50" />
          <AlertDialog.Popup className={modal + " !z-[81]"}>
            <AlertDialog.Title className="font-black text-lg">
              Delete {deletion?.label}?
            </AlertDialog.Title>
            <AlertDialog.Description className="my-3 text-sm">
              This action cannot be undone.
            </AlertDialog.Description>
            <div className="flex justify-end gap-2">
              <AlertDialog.Close render={<Button variant="outline" />}>Cancel</AlertDialog.Close>
              <Button
                variant="destructive"
                disabled={mutation.isPending}
                onClick={() => {
                  if (deletion)
                    run("delete", deletion.path, undefined, "Deleted", () => setDeletion(null));
                }}
              >
                Delete
              </Button>
            </div>
          </AlertDialog.Popup>
        </AlertDialog.Portal>
      </AlertDialog.Root>
    </div>
  );
}
