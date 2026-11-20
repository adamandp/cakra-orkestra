"use client";
import { useState } from "react";
import { TrophyIcon, SearchIcon, UsersIcon, CheckCircle2Icon, SparklesIcon } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Pagination } from "@/components/shared/pagination";
import { useLeaderboard } from "../score.query";
import type { LeaderboardEntry } from "@/interface/score.interface";

function MemberAvatar({ member }: { member: LeaderboardEntry }) {
  return <Avatar className="size-10 shrink-0"><AvatarImage src={member.avatar_url ?? undefined} /><AvatarFallback>{member.name.split(" ").slice(0,2).map(n => n[0]).join("").toUpperCase()}</AvatarFallback></Avatar>;
}
export function ScoreLeaderboard({ viewerId, month }: { viewerId: string; month: string }) {
  const query = useLeaderboard(viewerId, month);
  const [search,setSearch] = useState("");
  const [offset,setOffset] = useState(0);
  const [limit,setLimit] = useState(10);
  if (query.isError) return <Card className="p-5"><p className="text-sm text-destructive"><span className="system-copy">Unable to load leaderboard.</span></p><Button variant="outline" onClick={() => void query.refetch()}>Retry</Button></Card>;
  if (!query.data) return <Skeleton className="h-80 w-full" />;
  const rows = query.data;
  const filtered = rows.filter(row => (row.name + " " + row.username).toLowerCase().includes(search.trim().toLowerCase()));
  const start = Math.min(offset, Math.max(0, Math.floor((filtered.length-1)/limit)*limit));
  const page = filtered.slice(start,start+limit);
  return <div className="min-w-0 space-y-4">
    <div className="grid gap-3 grid-cols-1 sm:grid-cols-3">
      {[[UsersIcon,"Participants",rows.length],[SparklesIcon,"Total verified points",rows.reduce((sum,row)=>sum+row.approved_points,0)],[CheckCircle2Icon,"Completed tasks",rows.reduce((sum,row)=>sum+row.completed_tasks,0)]].map(([Icon,label,value],i) => {
        const StatIcon = Icon as typeof TrophyIcon;
        return <Card key={i} data-stat-tone={["blue","mint","purple"][i]} className="gap-2 p-4"><div className="flex items-center gap-2 text-sm text-muted-foreground"><StatIcon className="size-4" />{String(label)}</div><p className="text-2xl font-black tabular-nums">{String(value)}</p></Card>;
      })}
    </div>
    <Card className="min-w-0 gap-0 overflow-hidden py-0">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b-2 px-4 py-3"><div><h2 className="font-bold"><span className="system-copy">Monthly rankings</span></h2><p className="text-xs text-muted-foreground"><span className="system-copy">Ranked by approved points, then completed tasks.</span></p></div><div className="relative w-full sm:w-64"><SearchIcon className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"/><Input className="pl-9" placeholder="Search member..." aria-label="Search member" value={search} onChange={e=>{setSearch(e.target.value);setOffset(0);}}/></div></div>
      <div className="grid grid-cols-[36px_minmax(0,1fr)_64px] items-center gap-2 border-b bg-muted/40 px-4 py-2 text-xs font-semibold text-muted-foreground sm:grid-cols-[48px_minmax(0,1fr)_100px_100px]"><span><span className="system-copy">Rank</span></span><span><span className="system-copy">Member</span></span><span className="hidden text-right sm:block"><span className="system-copy">Completed</span></span><span className="text-right"><span className="system-copy">Points</span></span></div>
      {page.map(member=><div key={member.user_id} className={`grid grid-cols-[36px_minmax(0,1fr)_64px] items-center gap-2 border-b px-4 py-3 sm:grid-cols-[48px_minmax(0,1fr)_100px_100px] ${member.rank === 1 ? "bg-amber-100/70 dark:bg-[#ffe58a] dark:text-[#141820] dark:[&_.text-muted-foreground]:text-[#50401e]" : member.rank === 2 ? "bg-slate-100/80 dark:bg-[#d5deef] dark:text-[#141820] dark:[&_.text-muted-foreground]:text-[#34465c]" : member.rank === 3 ? "bg-orange-100/70 dark:bg-[#ffc18c] dark:text-[#141820] dark:[&_.text-muted-foreground]:text-[#593719]" : member.rank % 2 === 0 ? "bg-muted/40" : "bg-card"}`}><span className={`inline-flex h-7 w-8 items-center justify-center rounded-[3px] text-xs font-bold tabular-nums ${member.rank === 1 ? "border border-amber-600 bg-amber-200 text-amber-950" : member.rank === 2 ? "border border-slate-400 bg-slate-200 text-slate-800" : member.rank === 3 ? "border border-orange-500 bg-orange-200 text-orange-950" : ""}`}>#{member.rank}</span><div className="flex min-w-0 items-center gap-2"><MemberAvatar member={member}/><div className="min-w-0"><p className="truncate text-sm font-semibold">{member.name}{member.user_id===viewerId && " (You)"}</p><p className="truncate text-xs text-muted-foreground">@{member.username}<span className="sm:hidden"> · {member.completed_tasks} tasks</span></p></div></div><span className="hidden text-right text-sm tabular-nums sm:block">{member.completed_tasks}</span><span className="text-right font-black tabular-nums">{member.approved_points}</span></div>)}
      {!page.length && <p className="p-8 text-center text-sm text-muted-foreground"><span className="system-copy">No members found.</span></p>}
      <div className="px-4"><Pagination total={filtered.length} limit={limit} offset={start} count={page.length} onOffsetChange={setOffset} onLimitChange={n=>{setLimit(n);setOffset(0);}} /></div>
    </Card>
  </div>;
}
