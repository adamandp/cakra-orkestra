"use client";

import { useEffect, useRef, useState, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Tabs as TabsPrimitive } from "@base-ui/react/tabs";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ArrowLeftIcon, PencilIcon, UsersIcon, ChevronDownIcon, Trash2Icon, AlertTriangleIcon, SearchIcon, LayoutDashboardIcon, ClipboardListIcon } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Pagination } from "@/components/shared/pagination";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { AlertDialog } from "@base-ui/react/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover } from "@base-ui/react/popover";
import { useUpdateProject, useUpdateProjectStatus, useRemoveProjectMember, useAddProjectMembers } from "../project.mutation";
import { projectStatusSchema, updateProjectSchema } from "../project.schema";
import { projectStatusLabels } from "./project-toolbar";
import { ProjectUserPicker } from "./project-user-picker";
import { useAuth } from "@/providers/auth-provider";
import type { ProjectUser, UpdateProjectInput } from "@/interface/project.interface";
import { getProjectError } from "../project.api";
import { useProject } from "../project.query";
import { ProjectStatusBadge } from "./project-card";
import { useQuery } from "@tanstack/react-query";
import { getTasks } from "@/features/tasks/task.api";
import { taskKeys } from "@/features/tasks/task.query";
import { TaskManagement } from "@/features/tasks/components/task-management";

function ProjectPerson({ user }: { user: ProjectUser }) {
  const initials = user.name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
  return (
    <div className="flex min-w-0 items-center gap-3">
      <Avatar className="shrink-0">
        {user.avatar_url && <AvatarImage src={user.avatar_url} alt="" />}
        <AvatarFallback>{initials}</AvatarFallback>
      </Avatar>
      <div className="min-w-0 break-words text-sm">
        <p className="font-medium">
          {user.name}
          {!user.is_active && " (inactive)"}
        </p>
        <p className="text-xs text-muted-foreground">@{user.username}</p>
      </div>
    </div>
  );
}

export function ProjectDetail({ projectId }: { projectId: string }) {
  return <Suspense fallback={<Skeleton className="h-44 w-full" />}><ProjectDetailContent key={projectId} projectId={projectId} /></Suspense>;
}

function ProjectDetailContent({ projectId }: { projectId: string }) {
  const searchParams = useSearchParams();
  const requestedTab = searchParams.get("tab");
  const activeTab = requestedTab === "members" || requestedTab === "tasks" ? requestedTab : "overview";
  useEffect(() => {
    if (requestedTab === activeTab) return;
    const url = new URL(window.location.href);
    url.searchParams.set("tab", activeTab);
    window.history.replaceState(null, "", url);
  }, [requestedTab, activeTab]);
  function changeTab(value: unknown) {
    if (value !== "overview" && value !== "members" && value !== "tasks") return;
    const url = new URL(window.location.href);
    if (url.searchParams.get("tab") === value) return;
    url.searchParams.set("tab", value);
    window.history.pushState(null, "", url);
  }
  const { user } = useAuth();
  const isAdmin = user?.role === "ADMIN";
  const query = useProject(projectId);
  const [action, setAction] = useState<"owner" | "name" | "description" | null>(null);
  const project = query.data;
  const [memberSearch, setMemberSearch] = useState("");
  const [memberLimit, setMemberLimit] = useState(10);
  const [memberOffset, setMemberOffset] = useState(0);
  const filteredMembers = (project?.members ?? []).filter((member) =>
    member.id !== project?.owner_id && [member.name, member.username].some((value) => value.toLowerCase().includes(memberSearch.trim().toLowerCase()))
  );
  const memberPageOffset = Math.min(memberOffset, Math.max(0, Math.ceil(filteredMembers.length / memberLimit) - 1) * memberLimit);
  const visibleMembers = filteredMembers.slice(memberPageOffset, memberPageOffset + memberLimit);
  useEffect(() => { if (memberOffset !== memberPageOffset) setMemberOffset(memberPageOffset); }, [memberOffset, memberPageOffset]);
  const update = useUpdateProject();
  const updateStatus = useUpdateProjectStatus();
  const removeMember = useRemoveProjectMember();
  const addMembers = useAddProjectMembers();
  const [membersOpen, setMembersOpen] = useState(false);
  const [newMembers, setNewMembers] = useState<ProjectUser[]>([]);
  const [removingMember, setRemovingMember] = useState<ProjectUser | null>(null);
  const removalParams = { project_id: projectId, assignee_id: removingMember?.id, exclude_status: "DONE" as const, limit: 1, offset: 0 };
  const unfinished = useQuery({
    queryKey: taskKeys.list(removalParams),
    queryFn: ({ signal }) => getTasks(removalParams, signal),
    enabled: isAdmin && !!removingMember,
    staleTime: 0,
  });
  const unfinishedCount = unfinished.data?.total ?? 0;
  function closeRemoval() {
    if (removeMember.isPending) return;
    setRemovingMember(null);
    removeMember.reset();
  }
  const [ownerOpen, setOwnerOpen] = useState(false);
  const [draft, setDraft] = useState("");
  const [owners, setOwners] = useState<ProjectUser[]>([]);
  const [error, setError] = useState("");
  const confirmRef = useRef<HTMLButtonElement>(null);
  const titleEditorRef = useRef<HTMLDivElement>(null);
  const [discardTitleOpen, setDiscardTitleOpen] = useState(false);
  const keepEditingRef = useRef<HTMLButtonElement>(null);
  const [confirmation, setConfirmation] = useState<UpdateProjectInput | null>(null);
  useEffect(() => {
    if (action !== "name" || confirmation || discardTitleOpen || update.isPending) return;
    function handleOutside(event: MouseEvent) {
      if (!(event.target instanceof Node) || !titleEditorRef.current || titleEditorRef.current.contains(event.target)) return;
      if (draft.trim() !== (project?.name ?? "")) {
        event.preventDefault();
        event.stopPropagation();
        setDiscardTitleOpen(true);
        return;
      }
      setAction(null);
      setError("");
    }
    document.addEventListener("click", handleOutside, true);
    return () => document.removeEventListener("click", handleOutside, true);
  }, [action, confirmation, discardTitleOpen, update.isPending, draft, project?.name]);
  function requestSave(input: UpdateProjectInput) {
    const parsed = updateProjectSchema.safeParse(input);
    if (!parsed.success) { setError(parsed.error.issues[0]?.message ?? "Invalid input"); return; }
    setError("");
    if (project && (
      (parsed.data.name !== undefined && parsed.data.name === project.name) ||
      (parsed.data.description !== undefined && (parsed.data.description ?? "") === (project.description ?? ""))
    )) {
      toast.info("Nothing changes");
      return;
    }
    setConfirmation(parsed.data);
  }
  async function save(input: UpdateProjectInput) {
    if (!project || !isAdmin) return;
    const parsed = updateProjectSchema.safeParse(input);
    if (!parsed.success) { setError(parsed.error.issues[0]?.message ?? "Invalid input"); return; }
    try {
      await update.mutateAsync({ id: project.id, input: parsed.data });
      toast.success("Project updated");
      closeSheet();
    } catch (error) { setError(getProjectError(error)); }
  }
  function begin(field: "name" | "description") {
    if (!project) return;
    setError("");
    setDraft(project[field] ?? "");
    setAction(field);
  }
  const hasChanges = action === "name"
    ? draft.trim() !== (project?.name ?? "")
    : action === "description" && draft.trim() !== (project?.description ?? "");
  const editControls = <div className="flex flex-wrap items-center justify-end gap-2">
    {error && <p role="alert" className="mr-auto text-sm text-destructive">{error}</p>}
    {hasChanges && <Button size="sm" variant="outline" disabled={update.isPending} onClick={closeSheet}><span className="system-copy">Cancel</span></Button>}
    <Button size="sm" disabled={update.isPending} onClick={() => requestSave(action === "name" ? { name: draft } : { description: draft.trim() || null })}>Save</Button>
  </div>;
  function closeSheet() {
    if (action === "owner") setOwnerOpen(false);
    setAction(null);
    setConfirmation(null);
  }

  return (
    <div className="space-y-6">
      <Link
        href="/projects"
        className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:underline"
      >
        <ArrowLeftIcon className="size-4" /> Back to projects
      </Link>
      {query.isPending ? (
        <div className="space-y-4">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-44 w-full" />
        </div>
      ) : query.isError || !project ? (
        <div role="alert" className="space-y-3 rounded-lg border-2 border-border p-6 text-center">
          <p className="text-sm text-destructive">{getProjectError(query.error)}</p>
          <Button variant="outline" onClick={() => void query.refetch()}>
            Retry
          </Button>
        </div>
      ) : (
        <>
          <div className="space-y-1.5 border-b-[3px] border-border pb-4 sm:pb-5">
            {isAdmin && action === "name" ? (
              <div ref={titleEditorRef} className="space-y-2">
                <input aria-label="Project name" autoFocus value={draft} maxLength={255} disabled={update.isPending} onFocus={(e) => { const end = e.target.value.length; e.target.setSelectionRange(end, end); }} onChange={(e) => setDraft(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); requestSave({ name: draft }); } if (e.key === "Escape" && !update.isPending) closeSheet(); }} className="block w-full min-w-0 bg-transparent p-0 text-3xl sm:text-4xl lg:text-5xl font-black leading-[1.03] tracking-[-0.065em] outline-none border-b-2 border-dashed border-border" />
                {editControls}
              </div>
            ) : (
              <h1 className="break-words text-3xl sm:text-4xl lg:text-5xl leading-[1.03] font-black tracking-[-0.065em]">
                {isAdmin ? <button type="button" onClick={() => begin("name")} className="group inline-flex max-w-full items-center gap-4 sm:gap-5 text-left"><span className="min-w-0 break-words">{project.name}</span><PencilIcon className="size-4 shrink-0 text-muted-foreground opacity-100 lg:opacity-0 lg:group-hover:opacity-100 group-focus-visible:opacity-100" /></button> : project.name}
              </h1>
            )}
            <p className="text-sm leading-relaxed">{project.code}</p>
          </div>
      <Tabs value={activeTab} onValueChange={changeTab} className="min-w-0 gap-4">
        <TabsList aria-label="Project detail views" className="team-pulse-tabs relative isolate grid w-full grid-cols-3 gap-1 rounded-md border-2 border-border bg-muted/40 p-1.5 group-data-horizontal/tabs:h-auto sm:w-fit sm:gap-2">
          {[
            { value: "overview", label: "Overview", icon: LayoutDashboardIcon },
            { value: "members", label: "Team", icon: UsersIcon },
            { value: "tasks", label: "Tasks", icon: ClipboardListIcon },
          ].map(({ value, label, icon: Icon }) => (
            <TabsTrigger key={value} value={value} className="z-10 h-auto min-w-0 flex-col gap-1.5 rounded-[3px] border-2 border-transparent px-2 py-2.5 text-center text-xs font-semibold whitespace-normal text-muted-foreground hover:bg-background/60 hover:text-foreground data-active:text-foreground sm:flex-row sm:gap-2 sm:px-4 sm:text-sm">
              <Icon className="size-4 shrink-0" />
              {label}
            </TabsTrigger>
          ))}
          <TabsPrimitive.Indicator className="pointer-events-none absolute left-0 top-0 -z-0 h-(--active-tab-height) w-(--active-tab-width) translate-x-(--active-tab-left) translate-y-(--active-tab-top) rounded-[3px] border-2 border-border bg-[var(--yellow)] shadow-[2px_2px_0_var(--shadow-color)] transition-[translate,width,height] duration-250 ease-out motion-reduce:transition-none" />
        </TabsList>
          <TabsContent value="overview" className="team-pulse-panel min-w-0" keepMounted>
          <section className="space-y-4 rounded-lg border-2 border-border bg-card p-5 shadow-neo-sm">
            <h2 className="font-bold"><span className="system-copy">Overview</span></h2>
            <div className="space-y-2">
              <p className="text-xs font-semibold text-muted-foreground"><span className="system-copy">Description</span></p>
              {isAdmin && action === "description" ? (
                <div className="space-y-2"><textarea aria-label="Project description" autoFocus rows={4} disabled={update.isPending} value={draft} onChange={(e) => setDraft(e.target.value)} className="w-full rounded-md border-2 border-border bg-background p-3 text-sm" />{editControls}</div>
              ) : isAdmin ? (
                <button type="button" onClick={() => begin("description")} className="group flex w-full items-start gap-4 text-left text-sm text-muted-foreground"><span className="min-w-0 whitespace-pre-wrap break-words">{project.description || "No description."}</span><PencilIcon className="size-4 shrink-0 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 group-focus-visible:opacity-100" /></button>
              ) : <p className="whitespace-pre-wrap break-words text-sm text-muted-foreground">{project.description || "No description."}</p>}
            </div>
            <div className="grid gap-4 border-t pt-4 sm:grid-cols-2">
              <div className="min-w-0 space-y-2">
                <p className="text-xs font-semibold text-muted-foreground"><span className="system-copy">Status</span></p>
                {isAdmin ? <Select value={project.status} disabled={updateStatus.isPending || update.isPending} onValueChange={async (value) => {
                  const parsed = projectStatusSchema.safeParse(value);
                  if (!parsed.success || parsed.data === project.status) return;
                  try { await updateStatus.mutateAsync({ id: project.id, input: { status: parsed.data } }); toast.success("Project status updated"); }
                  catch (error) { toast.error(getProjectError(error)); }
                }}><SelectTrigger aria-label="Project status" className="group w-full data-[size=default]:h-14 !shadow-none hover:bg-background [&>svg]:hidden"><SelectValue><ProjectStatusBadge status={project.status} /></SelectValue><span className="shrink-0 text-muted-foreground opacity-100 lg:opacity-0 lg:group-hover:opacity-100 group-focus-visible:opacity-100"><PencilIcon className="size-4" /></span></SelectTrigger><SelectContent>{projectStatusSchema.options.map((value) => <SelectItem key={value} value={value}>{projectStatusLabels[value]}</SelectItem>)}</SelectContent></Select> : <div className="flex h-14 items-center border-2 border-border bg-background px-3"><ProjectStatusBadge status={project.status} /></div>}
              </div>
              <div className="min-w-0 space-y-2">
                <p className="text-xs font-semibold text-muted-foreground"><span className="system-copy">Project owner</span></p>
                <div className="flex min-h-14 items-center border-2 border-border bg-background px-3 py-2"><ProjectPerson user={project.owner} /></div>
              </div>
            </div>
            <dl className="grid gap-3 border-t pt-4 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-xs text-muted-foreground">Created at</dt>
                <dd>{new Date(project.created_at).toLocaleString()}</dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">Updated at</dt>
                <dd>{new Date(project.updated_at).toLocaleString()}</dd>
              </div>
            </dl>
          </section>
          </TabsContent>
          <TabsContent value="members" className="team-pulse-panel min-w-0" keepMounted>
          <section className="space-y-4 rounded-lg border-2 border-border bg-card p-5 shadow-neo-sm">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="font-bold"><span className="system-copy">Project owner</span></h2>
                {isAdmin && (
                  <Popover.Root open={ownerOpen} onOpenChange={(open) => {
                    if (update.isPending) return;
                    setOwnerOpen(open);
                    if (open) { setOwners([project.owner]); setError(""); setAction("owner"); }
                    else { setAction((current) => current === "owner" ? null : current); setError(""); }
                  }}>
                    <Popover.Trigger render={<Button type="button" variant="outline" aria-label="Change project owner"  disabled={update.isPending} />}>
                      <PencilIcon /> Change owner
                    </Popover.Trigger>
                    <Popover.Portal>
                      <Popover.Positioner align="end" sideOffset={8} className="z-50">
                        <Popover.Popup data-slot="popover-content" className="w-96 max-w-[var(--available-width)] max-h-[var(--available-height)] overflow-y-auto space-y-3 rounded-md border-2 border-border bg-popover p-3 shadow-neo-card">
                          <ProjectUserPicker label="Project owner" selected={owners} onChange={setOwners} disabled={update.isPending} />
                          {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
                          <div className="flex justify-end gap-2">
                            <Button size="sm" variant="outline" disabled={update.isPending} onClick={closeSheet}><span className="system-copy">Cancel</span></Button>
                            <Button size="sm" disabled={update.isPending || !owners.length || owners[0]?.id === project.owner_id} onClick={() => void save({ owner_id: owners[0]?.id })}>Save owner</Button>
                          </div>
                        </Popover.Popup>
                      </Popover.Positioner>
                    </Popover.Portal>
                  </Popover.Root>
                )}

            </div>
            <div className="flex min-w-0 items-center justify-between gap-3 rounded-md border-2 border-border border-l-[5px] border-l-yellow bg-yellow/15 p-3">
              <ProjectPerson user={project.owner} />
              <span className="shrink-0 text-xs text-muted-foreground">{project.owner.is_active ? "Active" : "Inactive"}</span>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
              <h3 className="font-bold">Members ({project.members.filter((member) => member.id !== project.owner_id).length})</h3>
              {isAdmin && (
                <Popover.Root open={membersOpen} onOpenChange={(open) => {
                  if (addMembers.isPending) return;
                  setMembersOpen(open);
                  if (open) { setNewMembers([]); addMembers.reset(); }
                }}>
                  <Popover.Trigger render={<Button variant="outline" />}><UsersIcon /> Add members</Popover.Trigger>
                  <Popover.Portal>
                    <Popover.Positioner align="end" sideOffset={8} className="z-50">
                      <Popover.Popup data-slot="popover-content" className="w-96 max-w-[var(--available-width)] max-h-[var(--available-height)] overflow-y-auto space-y-3 bg-popover p-3">
                        <ProjectUserPicker label="Add project members" multiple selected={newMembers} excludedIds={[project.owner_id, ...project.members.map((member) => member.id)]} disabled={addMembers.isPending} onChange={setNewMembers} />
                        {addMembers.isError && <p role="alert" className="text-sm text-destructive">{getProjectError(addMembers.error)}</p>}
                        <div className="flex flex-wrap justify-end gap-2">
                          <Button size="sm" variant="outline" disabled={addMembers.isPending} onClick={() => setMembersOpen(false)}>Cancel</Button>
                          <Button size="sm" disabled={addMembers.isPending || !newMembers.length} onClick={async () => {
                            const ids = newMembers.filter((member) => member.id !== project.owner_id && !project.members.some((existing) => existing.id === member.id)).map((member) => member.id);
                            if (!ids.length) return;
                            try { await addMembers.mutateAsync({ id: project.id, input: { member_ids: ids } }); setMembersOpen(false); setNewMembers([]); toast.success("Members added"); } catch { /* Show error in popover. */ }
                          }}>{addMembers.isPending ? "Adding..." : `Add members (${newMembers.length})`}</Button>
                        </div>
                      </Popover.Popup>
                    </Popover.Positioner>
                  </Popover.Portal>
                </Popover.Root>
              )}
            </div>
            <div className="relative">
              <SearchIcon className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input aria-label="Search project members" placeholder="Search members..." value={memberSearch} className="pl-9" onChange={(event) => { setMemberSearch(event.target.value); setMemberOffset(0); }} />
            </div>
            <div className="min-w-0 rounded-md border-2 border-border">
              <table className="w-full table-fixed text-sm">
                <thead className="border-b-2 border-border bg-muted/40 text-left text-xs">
                  <tr>
                    <th scope="col" className="p-3">Member</th>
                    <th scope="col" className="hidden w-28 p-3 sm:table-cell">Status</th>
                    {isAdmin && <th scope="col" className="w-20 p-3 text-right sm:w-24">Actions</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {visibleMembers.map((member) => (
                    <tr key={member.id} className="hover:bg-muted/40">
                      <td className="p-2 sm:p-3"><ProjectPerson user={member} /></td>
                      <td className="hidden p-3 text-xs text-muted-foreground sm:table-cell">{member.is_active ? "Active" : "Inactive"}</td>
                      {isAdmin && <td className="p-2 text-right sm:p-3"><Button type="button" variant="ghost" size="icon-sm" className="shrink-0 text-muted-foreground hover:bg-destructive/10 hover:text-destructive" aria-label={`Remove ${member.name}`} onClick={() => { removeMember.reset(); setRemovingMember(member); }}><Trash2Icon /></Button></td>}
                    </tr>
                  ))}
                </tbody>
              </table>
              {!visibleMembers.length && <p className="p-6 text-center text-sm text-muted-foreground">{project.members.length ? "No matching members." : "No project members yet."}</p>}
              <div className="border-t px-3"><Pagination total={filteredMembers.length} limit={memberLimit} offset={memberPageOffset} count={visibleMembers.length} onOffsetChange={setMemberOffset} onLimitChange={(limit) => { setMemberLimit(limit); setMemberOffset(0); }} label="Project members pagination" /></div>
            </div>
          </section>
          </TabsContent>
          <TabsContent value="tasks" className="team-pulse-panel min-w-0" keepMounted>
            <TaskManagement key={project.id} project={project} />
          </TabsContent>
          </Tabs>
          <AlertDialog.Root open={removingMember !== null} onOpenChange={(open) => { if (!open) closeRemoval(); }}>
            <AlertDialog.Portal>
              <AlertDialog.Backdrop className="fixed inset-0 z-50 bg-black/25 backdrop-blur-sm" onClick={closeRemoval} />
              <AlertDialog.Popup className="fixed left-1/2 top-1/2 z-50 w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 space-y-4 rounded-lg border-2 border-border bg-card p-5 shadow-neo-sm">
                <AlertDialog.Title className="text-lg font-bold">Remove member?</AlertDialog.Title>
                <AlertDialog.Description className="text-sm text-muted-foreground">Remove {removingMember?.name} from this project? Their account and task history will be retained.</AlertDialog.Description>
                {unfinished.isFetching ? <p className="text-sm text-muted-foreground"><span className="system-copy">Checking unfinished tasks...</span></p> : unfinished.isError ? <p role="alert" className="text-sm text-destructive"><span className="system-copy">Unable to check unfinished tasks. Please try again.</span></p> : unfinishedCount > 0 ? (
                  <div role="alert" className="flex gap-3 rounded-md border-2 border-border bg-muted p-3 text-sm"><AlertTriangleIcon className="size-5 shrink-0 text-destructive" /><div><p className="font-semibold">{unfinishedCount} unfinished {unfinishedCount === 1 ? "task" : "tasks"}</p><p className="mt-1 text-muted-foreground"><span className="system-copy">Reassign or complete these tasks before removing this member.</span></p></div></div>
                ) : null}
                {removeMember.isError && <p role="alert" className="text-sm text-destructive">{getProjectError(removeMember.error)}</p>}
                <div className="flex justify-end gap-2">
                  <AlertDialog.Close render={<Button variant="outline" disabled={removeMember.isPending} />}>Cancel</AlertDialog.Close>
                  {unfinished.isError ? <Button variant="outline" onClick={() => void unfinished.refetch()}>Retry</Button> : <Button variant="destructive" data-retain-disabled-shadow="" disabled={!removingMember || unfinished.isPending || unfinished.isFetching || unfinishedCount > 0 || removeMember.isPending} onClick={async () => {
                    if (!removingMember) return;
                    try { await removeMember.mutateAsync({id: project.id, userId: removingMember.id}); setRemovingMember(null); toast.success("Member removed"); }
                    catch { void unfinished.refetch(); }
                  }}>{removeMember.isPending ? "Removing..." : "Remove member"}</Button>}
                </div>
              </AlertDialog.Popup>
            </AlertDialog.Portal>
          </AlertDialog.Root>
          <AlertDialog.Root open={discardTitleOpen} onOpenChange={(open) => { if (!open) setDiscardTitleOpen(false); }}>
            <AlertDialog.Portal>
              <AlertDialog.Backdrop className="fixed inset-0 z-50 bg-black/25 backdrop-blur-sm" onClick={() => setDiscardTitleOpen(false)} />
              <AlertDialog.Popup initialFocus={keepEditingRef} className="fixed left-1/2 top-1/2 z-50 w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 space-y-4 rounded-lg border-2 border-border bg-card p-5 shadow-neo-sm">
                <AlertDialog.Title className="text-lg font-bold">Unsaved changes</AlertDialog.Title>
                <AlertDialog.Description className="text-sm text-muted-foreground">You have unsaved changes to the project name. Discard them and exit editing mode?</AlertDialog.Description>
                <div className="flex flex-wrap justify-end gap-2">
                  <AlertDialog.Close render={<Button ref={keepEditingRef} variant="outline" />}>Keep editing</AlertDialog.Close>
                  <Button variant="destructive" onClick={() => { setDiscardTitleOpen(false); setAction(null); setDraft(project.name); setError(""); }}>Discard changes</Button>
                </div>
              </AlertDialog.Popup>
            </AlertDialog.Portal>
          </AlertDialog.Root>
          <AlertDialog.Root open={confirmation !== null} onOpenChange={(open) => { if (!open) setConfirmation(null); }}>
            <AlertDialog.Portal>
              <AlertDialog.Backdrop className="fixed inset-0 z-50 bg-black/25 backdrop-blur-sm" onClick={() => setConfirmation(null)} />
              <AlertDialog.Popup initialFocus={confirmRef} className="fixed left-1/2 top-1/2 z-50 w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 space-y-4 rounded-lg border-2 border-border bg-card p-5 shadow-neo-sm">
                <AlertDialog.Title className="text-lg font-bold">Save changes?</AlertDialog.Title>
                <AlertDialog.Description className="text-sm text-muted-foreground">Are you sure you want to update the project {confirmation?.name !== undefined ? "name" : "description"}?</AlertDialog.Description>
                <div className="flex justify-end gap-2">
                  <AlertDialog.Close render={<Button variant="outline" className="focus-visible:border-border focus-visible:ring-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-border" />}>Cancel</AlertDialog.Close>
                  <Button ref={confirmRef} className="focus-visible:border-border focus-visible:ring-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-border" disabled={update.isPending} onClick={() => { if (confirmation) { const input = confirmation; setConfirmation(null); void save(input); } }}>Confirm</Button>
                </div>
              </AlertDialog.Popup>
            </AlertDialog.Portal>
          </AlertDialog.Root>
        </>
      )}
    </div>
  );
}
