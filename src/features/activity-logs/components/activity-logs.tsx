"use client";
import { useState } from "react";
import { PageHeader } from "@/components/shared/page-header";
import { Pagination } from "@/components/shared/pagination";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select,SelectTrigger,SelectValue,SelectContent,SelectItem } from "@/components/ui/select";
import { Table,TableHeader,TableRow,TableHead,TableBody,TableCell } from "@/components/ui/table";
import { useActivityLogs } from "../activity-log.query";
import { actionLabel, resourceLabel, activityDetails, resourceLabels } from "../activity-log.format";
const resources=Object.keys(resourceLabels);
export function ActivityLogs(){
 const [q,setQ]=useState("");const [resource,setResource]=useState("all");const [offset,setOffset]=useState(0);const [limit,setLimit]=useState(10);
 const query=useActivityLogs({q:q.trim()||undefined,resource:resource==="all"?undefined:resource,limit,offset});
 const items=query.data?.items??[];
 return <div className="space-y-6"><PageHeader title="Activity Log" description="View your own sign-in history and workspace changes." actions={<Button variant="outline" onClick={()=>void query.refetch()}>Refresh</Button>}/>
 <section className="explorer-panel"><div className="flex flex-wrap gap-3 border-b-2 border-border p-4"><Input aria-label="Search activity" placeholder="Search activity..." className="min-w-40 flex-1" value={q} onChange={e=>{setQ(e.target.value);setOffset(0);}}/><Select value={resource} onValueChange={v=>{setResource(v??"all");setOffset(0);}}><SelectTrigger className="w-44"><SelectValue>{resource==="all"?"All resources":resourceLabels[resource]}</SelectValue></SelectTrigger><SelectContent><SelectItem value="all">All resources</SelectItem>{resources.map(r=><SelectItem key={r} value={r}>{resourceLabels[r]}</SelectItem>)}</SelectContent></Select></div>
 {query.isError?<div className="p-4" role="alert">Unable to load activity. <Button variant="outline" onClick={()=>void query.refetch()}>Retry</Button></div>:<Table><TableHeader><TableRow>{["Timestamp (WIB)","Actor","Action","Resource","Details","Outcome"].map(x=><TableHead key={x}>{x}</TableHead>)}</TableRow></TableHeader><TableBody>{items.map(x=><TableRow key={x.id}><TableCell>{new Date(x.created_at).toLocaleString("en-GB",{timeZone:"Asia/Jakarta"})}</TableCell><TableCell><div>{x.actor_name}</div><p className="text-xs text-muted-foreground">{x.actor_role??"Unauthenticated"}</p></TableCell><TableCell><Badge variant={/delet|remov/i.test(actionLabel(x))?"destructive":/creat|add|logged in/i.test(actionLabel(x))?"success":"outline"}>{actionLabel(x)}</Badge></TableCell><TableCell>{resourceLabel(x)}{x.target && <p className="max-w-48 truncate text-xs text-muted-foreground" title={x.target}>{x.target}</p>}</TableCell><TableCell className="whitespace-normal"><p className="max-w-64 break-words">{activityDetails(x)}</p><p className="text-xs text-muted-foreground">{x.changed_fields.map(f=>f.replaceAll("_"," ")).join(", ")}</p></TableCell><TableCell><Badge variant={x.outcome==="SUCCESS"?"success":"destructive"}>{x.outcome}</Badge></TableCell></TableRow>)}{!items.length&&<TableRow><TableCell colSpan={6} className="h-28 text-center text-muted-foreground">{query.isPending?"Loading activity...":"No activity recorded yet."}</TableCell></TableRow>}</TableBody></Table>}
 <div className="explorer-panel-footer"><Pagination total={query.data?.total??0} count={items.length} limit={limit} offset={offset} disabled={query.isFetching} onOffsetChange={setOffset} onLimitChange={v=>{setLimit(v);setOffset(0);}}/></div></section></div>;
}
