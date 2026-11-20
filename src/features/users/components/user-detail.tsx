"use client";

import { useState } from "react";
import { PencilIcon, UserRoundIcon, ShieldIcon, ActivityIcon, HistoryIcon } from "lucide-react";
import { AlertDialog } from "@base-ui/react/alert-dialog";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DatePicker } from "@/components/shared/date-picker";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter, useSheetLifecycle } from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import type { UserRole } from "@/interface/role.interface";
import { useUser } from "../user.query";
import { useUpdateUser, useUpdateUserRole, useUpdateUserStatus } from "../user.mutation";
import { updateUserSchema } from "../user.schema";
import { getUserError } from "../user.api";

type Section = "profile" | "role" | "status";
type Draft = { name: string; username: string; avatar_url: string; birth_date: string; role_id: string };
export function UserDetail({id,currentUserId,roles,onClose}: {id:string;currentUserId:string;roles:UserRole[];onClose:()=>void}) {
  const lifecycle = useSheetLifecycle(onClose);
  const query = useUser(id);
  const user = query.data;
  const profile = useUpdateUser();
  const role = useUpdateUserRole();
  const status = useUpdateUserStatus();
  const busy = profile.isPending || role.isPending || status.isPending;
  const [editing,setEditing] = useState<Section|null>(null);
  const [draft,setDraft] = useState<Draft|null>(null);
  const [confirm,setConfirm] = useState<"role"|"status"|"discard-close"|"discard-edit"|null>(null);
  const [error,setError] = useState("");
  const self = id === currentUserId;
  const dirty = Boolean(user && draft && (draft.name!==user.name || draft.username!==user.username || draft.avatar_url!==(user.avatar_url??"") || draft.birth_date!==(user.birth_date??"") || draft.role_id!==user.role_id));
  function reset(){setEditing(null);setDraft(null);setError("");setConfirm(null);}
  function close(){if(busy)return;if(dirty)setConfirm("discard-close");else lifecycle.close();}
  function begin(section:Section){
    if(!user || busy || editing || (self && section!=="profile"))return;
    setError("");
    if(section==="status"){setConfirm("status");return;}
    setEditing(section);setDraft({name:user.name,username:user.username,avatar_url:user.avatar_url??"",birth_date:user.birth_date??"",role_id:user.role_id});
  }
  function patch(value:Partial<Draft>){setDraft(previous=>previous?{...previous,...value}:previous);}
  async function save(){
    if(!draft||!user)return;
    if(editing==="role"){if(!self && draft.role_id!==user.role_id)setConfirm("role");else reset();return;}
    const parsed=updateUserSchema.safeParse({name:draft.name,username:draft.username,avatar_url:draft.avatar_url||null,birth_date:draft.birth_date||null});
    if(!parsed.success){setError(parsed.error.issues[0].message);return;}
    try{await profile.mutateAsync({id,input:parsed.data});toast.success("User updated");reset();}catch(e){setError(getUserError(e));toast.error(getUserError(e));}
  }
  async function apply(){
    if(!user||busy)return;
    if(confirm==="discard-close"||confirm==="discard-edit"){const closing=confirm==="discard-close";reset();if(closing)lifecycle.close();return;}
    if(self)return;
    try{
      if(confirm==="role"&&draft){await role.mutateAsync({id,input:{role_id:draft.role_id}});toast.success("Role updated");}
      else if(confirm==="status"){await status.mutateAsync({id,input:{is_active:!user.is_active}});toast.success(user.is_active?"User deactivated":"User activated");}
      reset();
    }catch(e){setError(getUserError(e));toast.error(getUserError(e));}
  }
  function header(section:Section,title:string,Icon:typeof UserRoundIcon){return <div className="flex items-center justify-between gap-2"><h3 className="flex items-center gap-2 text-sm font-bold"><Icon className="size-4"/>{title}</h3>{editing!==section && !(self&&section!=="profile") && <Button variant="ghost" size="icon-sm" pressAnimation={false} disabled={busy||Boolean(editing)} aria-label={`Edit ${title}`} className="opacity-0 group-hover/user-card:opacity-100 group-focus-within/user-card:opacity-100 [@media(hover:none)]:opacity-100" onClick={()=>begin(section)}><PencilIcon/></Button>}</div>;}
  function controls(){return <div className="space-y-2 border-t border-border pt-3">{error&&<p role="alert" className="text-sm text-destructive">{error}</p>}<div className="flex justify-end gap-2"><Button variant="outline" size="sm" disabled={busy} onClick={()=>dirty?setConfirm("discard-edit"):reset()}>Cancel</Button><Button size="sm" disabled={busy||!dirty} onClick={()=>void save()}>Save changes</Button></div></div>;}
  const card="group/user-card space-y-3 rounded-md border-2 border-border bg-card p-4 shadow-neo-sm";
  return <Sheet open={lifecycle.open} onOpenChangeComplete={lifecycle.onOpenChangeComplete} onOpenChange={open=>{if(!open)close();}}>
    <SheetContent preventDragDismiss={Boolean(editing)||busy} className="w-full gap-0 border-l-2 border-border sm:max-w-xl">
      <SheetHeader><SheetTitle><span className="system-copy">User details</span></SheetTitle><SheetDescription>Profile, access permissions and activity</SheetDescription></SheetHeader>
      <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-4">
        {query.isPending?<Skeleton className="h-48 w-full"/>:!user||query.isError?<div role="alert"><p>{getUserError(query.error)}</p><Button onClick={()=>void query.refetch()}>Retry</Button></div>:<>
          <section className={card}>{header("profile","Profile",UserRoundIcon)}
            <div className="flex items-center gap-3"><Avatar className="size-12">{user.avatar_url&&<AvatarImage src={user.avatar_url} alt=""/>}<AvatarFallback>{user.name.slice(0,2).toUpperCase()}</AvatarFallback></Avatar><div className="min-w-0"><h2 className="break-words text-xl font-black">{user.name}</h2><p className="text-sm text-muted-foreground">@{user.username}</p></div></div>
            {editing==="profile"&&draft?<><div className="grid gap-3">{(["name","username","avatar_url"] as const).map(key=><div key={key} className="space-y-1"><Label htmlFor={key}>{key==="name"?"Full name":key==="username"?"Username":"Avatar URL"}</Label><Input id={key} value={draft[key]} disabled={busy} onChange={e=>patch({[key]:e.target.value})}/></div>)}<div className="space-y-1"><Label htmlFor="user-detail-birth">Birth date</Label><DatePicker id="user-detail-birth" value={draft.birth_date} onChange={value=>patch({birth_date:value})} yearNavigation disabled={busy}/></div></div>{controls()}</>:<div className="text-sm"><p className="text-xs text-muted-foreground"><span className="system-copy">Birth date</span></p>{user.birth_date??"Not set"}</div>}
          </section>
          <section className={card}>{header("role","Role",ShieldIcon)}{editing==="role"&&draft?<><Select value={draft.role_id} onValueChange={value=>{if(value)patch({role_id:value});}} disabled={busy}><SelectTrigger className="w-full"><SelectValue>{roles.find(item=>item.id===draft.role_id)?.name}</SelectValue></SelectTrigger><SelectContent>{roles.map(item=><SelectItem key={item.id} value={item.id}>{item.name}</SelectItem>)}</SelectContent></Select>{controls()}</>:<Badge variant={user.role==="ADMIN"?"default":"outline"}>{user.role}</Badge>}</section>
          <section className={card}>{header("status","Account status",ActivityIcon)}<Badge variant={user.is_active?"success":"neutral"}>{user.is_active?"Active":"Inactive"}</Badge><p className="text-xs text-muted-foreground">{user.is_active?"Can sign in and access the workspace.":"Sign-in is disabled."}</p></section>
          <section className={card}><h3 className="flex items-center gap-2 text-sm font-bold"><HistoryIcon className="size-4"/>Activity</h3><div className="grid grid-cols-2 gap-3 text-sm">{([["Created",user.created_at],["Updated",user.updated_at]]).map(([label,value])=><div key={label}><p className="text-xs text-muted-foreground">{label}</p>{new Date(value).toLocaleString("en-GB",{timeZone:"Asia/Jakarta"})} WIB</div>)}</div></section>
        </>}
      </div>
      <SheetFooter><Button variant="outline" disabled={busy} onClick={close}><span className="system-copy">Close</span></Button></SheetFooter>
      <AlertDialog.Root open={confirm!==null} onOpenChange={open=>{if(!open&&!busy){setConfirm(null);setError("");}}}><AlertDialog.Portal><AlertDialog.Backdrop className="fixed inset-0 z-[60] bg-black/25 backdrop-blur-sm"/><AlertDialog.Popup className="fixed left-1/2 top-1/2 z-[60] w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 space-y-4 rounded-lg border-2 border-border bg-card p-5 shadow-neo-sm">
      <AlertDialog.Title className="text-lg font-bold">{confirm==="role"?"Change role":confirm==="status"?(user?.is_active?"Deactivate user":"Activate user"):"Unsaved changes"}</AlertDialog.Title>
      <AlertDialog.Description className="text-sm text-muted-foreground">{confirm==="role"?"This changes access permissions and revokes the existing session.":confirm==="status"?(user?.is_active?"This user will no longer be able to sign in. Existing data is retained.":"This user will be able to sign in again."):"Discard your unsaved changes?"}</AlertDialog.Description>
      {error&&<p role="alert" className="text-sm text-destructive">{error}</p>}<div className="flex justify-end gap-2"><Button variant="outline" disabled={busy} onClick={()=>{setConfirm(null);setError("");}}>Cancel</Button><Button variant={confirm==="role"||(confirm==="status"&&!user?.is_active)?"default":"destructive"} disabled={busy} onClick={()=>void apply()}>{busy?"Saving...":"Confirm"}</Button></div>
      </AlertDialog.Popup></AlertDialog.Portal></AlertDialog.Root>
    </SheetContent></Sheet>;
}
