"use client";
import { useState } from "react";
import Link from "next/link";
import { BellIcon, CheckIcon, Trash2Icon, ArrowRightIcon } from "lucide-react";
import { useQuery, useMutation, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import { useAuth } from "@/providers/auth-provider";
import { axiosInstance } from "@/lib/axios";
import type { WebResponse } from "@/interface/common.interface";
import type { Notification, NotificationList } from "@/interface/notification.interface";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { AlertDialog } from "@base-ui/react/alert-dialog";
import { Popover } from "@base-ui/react/popover";
function href(n:Notification){ return "/notifications/detail/"+n.id; }
function useNotifications(unread:boolean,offset:number,limit:number,enabled=true){
  const {user}=useAuth();
  return useQuery({queryKey:["notifications",user?.id,unread,offset,limit],enabled:!!user&&enabled,placeholderData:keepPreviousData,refetchInterval:15000,queryFn:async({signal})=>(await axiosInstance.get<WebResponse<NotificationList>>("/notifications",{params:{limit,offset,is_read:unread?false:undefined},signal})).data.data});
}
export function NotificationListView({compact=false,onNavigate}:{compact?:boolean;onNavigate?:()=>void}){
  const [unread,setUnread]=useState(false);
  const [deleteId,setDeleteId]=useState<string|null>(null);
  const [offset,setOffset]=useState(0);
  const limit=compact?5:15;
  const query=useNotifications(unread,offset,limit);
  const client=useQueryClient();
  const mutation=useMutation({mutationFn:async({id,action}:{id?:string;action:string})=>{
    if(action==="delete")await axiosInstance.delete("/notifications/"+id);
    else await axiosInstance.patch("/notifications/"+(id?id+"/":"")+action);
  },onSuccess:(_,variables)=>{if(variables.action==="delete"){setDeleteId(null);toast.success("Notification deleted");}return client.invalidateQueries({queryKey:["notifications"]});},onError:()=>toast.error("Unable to update notification")});
  return <div className="flex flex-col gap-3">
    <div className="flex flex-wrap items-center gap-2">
      <Button size="default" className="min-w-20 px-4" variant={!unread?"default":"outline"} onClick={()=>{setUnread(false);setOffset(0)}}>All</Button>
      <Button size="default" className="min-w-24 px-4" variant={unread?"default":"outline"} onClick={()=>{setUnread(true);setOffset(0)}}>Unread</Button>
      <Button size="sm" variant="ghost" className="ml-auto" disabled={mutation.isPending} onClick={()=>mutation.mutate({action:"read-all"})}>Mark all as read</Button>
    </div>
    {query.isPending?<p className="p-4 text-sm"><span className="system-copy">Loading notifications...</span></p>:query.isError?<p className="p-4 text-sm">Unable to load notifications. <button className="underline" onClick={()=>query.refetch()}>Retry</button></p>:!query.data?.items.length?<p className="border-2 border-dashed p-6 text-center text-sm text-muted-foreground"><span className="system-copy">No notifications.</span></p>:query.data.items.map(n=>{
      const url=href(n);
      return <div key={n.id} className={"relative grid min-w-0 grid-cols-[minmax(0,1fr)_auto] cursor-pointer items-center gap-2 border-2 border-border p-3 shadow-neo-sm transition-colors focus-within:ring-2 focus-within:ring-ring "+(n.read_at?"bg-card hover:bg-muted":"bg-[#cce7ff] hover:bg-[#b5dcff] dark:bg-[#a2d3ff] dark:hover:bg-[#80bfff] dark:text-[#141820] dark:[&_.text-muted-foreground]:text-[#34465c]")}>
        <div className="flex min-w-0 items-start gap-2"><BellIcon className="mt-0.5 size-4 shrink-0"/><div className="min-w-0 flex-1">
          {url?<Link href={url} onClick={()=>{onNavigate?.();if(!n.read_at)mutation.mutate({id:n.id,action:"read"})}} className="block break-words text-sm font-bold after:absolute after:inset-0 after:content-[''] focus-visible:underline">{!n.read_at&&<span className="sr-only"><span className="system-copy">Unread: </span></span>}{n.title} <ArrowRightIcon className="inline size-3"/></Link>:<p className="text-sm font-bold">{n.title}</p>}
          <p className="break-words text-sm">{n.message}</p><p className="mt-1 text-xs text-muted-foreground">{new Date(n.created_at).toLocaleString()}</p>
        </div></div>
        <div className="flex shrink-0 items-center gap-1">
        <Button className="relative z-10 size-7 shrink-0" size="icon-sm" variant="ghost" title={n.read_at?"Mark unread":"Mark read"} aria-label={n.read_at?"Mark unread":"Mark read"} disabled={mutation.isPending} onClick={()=>mutation.mutate({id:n.id,action:n.read_at?"unread":"read"})}><CheckIcon className="size-4"/></Button>
        {!compact&&<Button className="relative z-10 size-7 shrink-0" size="icon-sm" variant="ghost" aria-label="Delete notification" disabled={mutation.isPending} onClick={()=>setDeleteId(n.id)}><Trash2Icon className="size-4"/></Button>}</div>
      </div>
    })}
    {!compact&&<AlertDialog.Root open={deleteId!==null} onOpenChange={open=>{if(!open&&!mutation.isPending)setDeleteId(null)}}><AlertDialog.Portal><AlertDialog.Backdrop className="fixed inset-0 z-[70] bg-black/50"/><AlertDialog.Popup className="fixed left-1/2 top-1/2 z-[71] w-[calc(100%-2rem)] max-w-sm -translate-x-1/2 -translate-y-1/2 space-y-4 border-2 border-border bg-card p-5 shadow-neo-button"><AlertDialog.Title className="text-lg font-bold">Delete notification?</AlertDialog.Title><AlertDialog.Description className="text-sm text-muted-foreground">This notification will be permanently removed from your history.</AlertDialog.Description><div className="flex justify-end gap-2"><AlertDialog.Close render={<Button variant="outline" disabled={mutation.isPending}/>}>Cancel</AlertDialog.Close><Button variant="destructive" disabled={mutation.isPending} onClick={()=>{if(deleteId)mutation.mutate({id:deleteId,action:"delete"})}}>{mutation.isPending?"Deleting...":"Delete"}</Button></div></AlertDialog.Popup></AlertDialog.Portal></AlertDialog.Root>}
    {!compact&&<div className="flex items-center justify-between"><Button variant="outline" size="sm" disabled={!offset} onClick={()=>setOffset(Math.max(0,offset-limit))}>Previous</Button><span className="text-xs">{query.data?.total??0} notifications</span><Button variant="outline" size="sm" disabled={offset+limit>=(query.data?.total??0)} onClick={()=>setOffset(offset+limit)}>Next</Button></div>}
  </div>;
}
export function NotificationBell(){
  const [open,setOpen]=useState(false);
  const {user}=useAuth();
  const count=useQuery({queryKey:["notifications",user?.id,"count"],enabled:!!user,refetchInterval:15000,queryFn:async({signal})=>(await axiosInstance.get<WebResponse<{count:number}>>("/notifications/unread-count",{signal})).data.data.count});
  return <Popover.Root open={open} onOpenChange={setOpen}><Popover.Trigger render={<Button variant="outline" size="icon" className="relative shrink-0" aria-label="Notifications"/>}><BellIcon className="size-5"/>{!!count.data&&<span className="absolute -right-2 -top-2 min-w-5 border-2 border-border bg-primary px-1 text-center text-xs font-bold text-primary-foreground">{count.data>99?"99+":count.data}</span>}</Popover.Trigger><Popover.Portal><Popover.Positioner align="end" sideOffset={10} className="z-50"><Popover.Popup className="w-[min(400px,calc(100vw-24px))] max-h-[75vh] overflow-y-auto border-2 border-border bg-popover p-4 shadow-neo-button"><h2 className="mb-3 text-lg font-bold"><span className="system-copy">Notifications</span></h2><NotificationListView compact onNavigate={()=>setOpen(false)}/><Link className="mt-4 block border-2 border-border p-2 text-center text-sm font-bold hover:bg-muted" href="/notifications" onClick={()=>setOpen(false)}>View all notifications</Link></Popover.Popup></Popover.Positioner></Popover.Portal></Popover.Root>;
}
