"use client";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeftIcon, BellIcon } from "lucide-react";
import { useAuth } from "@/providers/auth-provider";
import { axiosInstance } from "@/lib/axios";
import type { WebResponse } from "@/interface/common.interface";
import type { Notification } from "@/interface/notification.interface";
import { useTask } from "@/features/tasks/task.query";
import { useProject } from "@/features/projects/project.query";
import { useChangelog } from "@/features/changelogs/changelog.query";
const card="space-y-3 border-2 border-border bg-card p-4 shadow-[3px_3px_0_var(--border)] sm:p-5";
function Back(){return <Link href="/notifications" className="inline-flex items-center gap-2 text-sm font-bold hover:underline"><ArrowLeftIcon className="size-4"/> All notifications</Link>}
function Field({label,value}:{label:string;value:string|null|undefined}){return <div><p className="text-xs font-bold uppercase text-muted-foreground">{label}</p><p className="break-words text-sm">{value||"—"}</p></div>}
export function TaskNotificationCard({id}:{id:string}){
  const query=useTask(id);const t=query.data;
  if(query.isPending)return <section className={card}>Loading task details...</section>;
  if(!t)return <section className={card}>Task details are no longer available.</section>;
  return <div className="grid gap-4 lg:grid-cols-2">
    <section className={card}><p className="text-xs font-bold text-muted-foreground">{t.code} · {t.task_status}</p><h2 className="text-xl font-bold">{t.title}</h2><p className="whitespace-pre-wrap break-words text-sm">{t.description}</p><div className="grid grid-cols-2 gap-4 border-t-2 pt-3"><Field label="Project" value={t.project.name}/><Field label="Assignee" value={t.assignee.name}/><Field label="Due date" value={t.due_date}/><Field label="Category" value={t.task_category}/></div>{t.blocker_reason&&<Field label="Blocker" value={t.blocker_reason}/>}</section>
    <section className={card}><h2 className="font-bold"><span className="system-copy">Checklist</span></h2>{t.checklists.length?t.checklists.map(c=><p key={c.id} className="border-b pb-2 text-sm">{c.is_completed?"✓":"○"} {c.title}</p>):<p className="text-sm text-muted-foreground"><span className="system-copy">No checklist items.</span></p>}<h2 className="border-t-2 pt-3 font-bold"><span className="system-copy">AI assessment</span></h2><Field label="Initial" value={t.ai_results.initial.status}/><Field label="Final" value={t.ai_results.final?.status}/><Field label="Evidence" value={String(t.evidences.length)+" attachment(s)"}/></section>
  </div>;
}
export function NotificationDetail({id}:{id:string}){
  const {user}=useAuth();
  const query=useQuery({queryKey:["notifications",user?.id,"detail",id],enabled:!!user,queryFn:async({signal})=>(await axiosInstance.get<WebResponse<Notification>>("/notifications/"+id,{signal})).data.data});
  const n=query.data;
  const unavailable=!!n&&["TASK_DELETED","TASK_UNASSIGNED","PROJECT_REMOVED"].includes(n.type);
  const project=useProject(n?.entity_type==="project"&&!unavailable?n.entity_id:"");
  const release=useChangelog(n?.entity_type==="changelog"?n.entity_id:"");
  return <div className="space-y-4 p-4 sm:p-6"><Back/>{query.isPending?<p><span className="system-copy">Loading notification...</span></p>:!n?<section className={card}>Notification not found.</section>:<>
    <section className={card}><div className="flex items-center gap-2 text-xs font-bold uppercase text-muted-foreground"><BellIcon className="size-4"/> Notification details · {n.read_at?"Read":"Unread"}</div><h1 className="text-2xl font-bold">{n.title}</h1><p className="break-words">{n.message}</p><p className="text-xs text-muted-foreground">{new Date(n.created_at).toLocaleString()}</p></section>
    {n.entity_type==="attendance"?<section className={card}><Link href="/attendance" className="font-bold underline">Open attendance board</Link></section>:unavailable?<section className={card}>The original item may no longer be accessible.</section>:n.entity_type==="task"?<TaskNotificationCard id={n.entity_id}/>:n.entity_type==="project"?<section className={card}><h2 className="font-bold"><span className="system-copy">Project details</span></h2>{project.data?<><Field label="Name" value={project.data.name}/><Field label="Description" value={project.data.description}/><Field label="Owner" value={project.data.owner.name}/><Field label="Status" value={project.data.status}/><Link className="text-sm font-bold underline" href={"/projects/"+project.data.id}>Open project</Link></>:<p>{project.isPending?"Loading...":"Project unavailable."}</p>}</section>:<section className={card}><h2 className="font-bold"><span className="system-copy">Release details</span></h2>{release.data?<><Field label="Version" value={release.data.version}/><Field label="Project" value={release.data.project.name}/><Field label="Description" value={release.data.description}/>{release.data.changes.map(c=><p key={c.id} className="border-t pt-2 text-sm">{c.description}</p>)}</>:<p>{release.isPending?"Loading...":"Release unavailable."}</p>}</section>}
  </>}</div>;
}
