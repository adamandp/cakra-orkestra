"use client";

import { useState, useEffect } from "react";
import { ChevronRightIcon, SearchIcon } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Pagination } from "@/components/shared/pagination";
import { useMemberWorkloads } from "@/features/dashboards/dashboard.query";
import { DashboardState } from "@/features/dashboards/components/dashboard-state";
import {
  DashboardTaskPoints,
  DashboardTaskStatus,
} from "@/features/dashboards/components/dashboard-task-status";
import type { WorkloadStatus } from "@/interface/dashboard.interface";

const workloadLabels: Record<WorkloadStatus, string> = {
  AVAILABLE: "Available",
  BALANCED: "Balanced",
  HIGH_LOAD: "High load",
};

function WorkloadBadge({ status }: { status: WorkloadStatus }) {
  return <Badge variant={status === "HIGH_LOAD" ? "destructive" : status === "BALANCED" ? "secondary" : "outline"}>{workloadLabels[status]}</Badge>;
}

export function MemberWorkloads({ onInspect }: { onInspect: (id: string) => void }) {
  const query = useMemberWorkloads();
  const workloads = query.data ?? [];
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [sort, setSort] = useState("desc");
  const [limit, setLimit] = useState(10);
  const [offset, setOffset] = useState(0);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [memberOpen, setMemberOpen] = useState(false);
  const [nextTask, setNextTask] = useState<string | null>(null);
  useEffect(() => {
    if (!selectedId) return;
    const frame = requestAnimationFrame(() => setMemberOpen(true));
    return () => cancelAnimationFrame(frame);
  }, [selectedId]);
  const selected = workloads.find((w) => w.member.id === selectedId);
  const filtered = workloads.filter((w) =>
    w.member.name.toLowerCase().includes(search.trim().toLowerCase()) &&
    (filter === "all" || w.status === filter)
  ).sort((a, b) => (sort === "desc" ? b.active_points - a.active_points : a.active_points - b.active_points) || a.member.name.localeCompare(b.member.name));
  const pageOffset = Math.min(offset, Math.max(0, Math.floor((filtered.length - 1) / limit) * limit));
  const rows = filtered.slice(pageOffset, pageOffset + limit);

  return (
    <section className="explorer-panel min-w-0">
      <div className="explorer-panel-heading">
        <div className="min-w-0">
          <h2 className="text-2xl leading-tight font-black tracking-tight"><span className="system-copy">Member workload</span></h2>
          <p className="mt-1 text-sm text-muted-foreground"><span className="system-copy">Estimated active points; provisional thresholds: 0–5 available, 6–12 balanced, 13+ high load.</span></p>
        </div>
        <span className="shrink-0 text-xs font-bold">{workloads.length} members</span>
      </div>
      <div className="grid grid-cols-2 gap-2 border-b-2 border-border p-3 sm:flex sm:p-4">
        <div className="relative col-span-2 min-w-0 sm:flex-1">
          <SearchIcon className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input aria-label="Search members" placeholder="Search members..." className="h-10 pl-9" value={search} onChange={(e) => { setSearch(e.target.value); setOffset(0); }} />
        </div>
        <Select value={filter} onValueChange={(v) => { if (v) { setFilter(v); setOffset(0); } }}>
          <SelectTrigger aria-label="Filter workload" className="h-10 min-w-0"><SelectValue>{filter === "all" ? "All workloads" : workloadLabels[filter as WorkloadStatus]}</SelectValue></SelectTrigger>
          <SelectContent><SelectItem value="all">All workloads</SelectItem>{Object.entries(workloadLabels).map(([value, label]) => <SelectItem key={value} value={value}>{label}</SelectItem>)}</SelectContent>
        </Select>
        <Select value={sort} onValueChange={(v) => { if (v) { setSort(v); setOffset(0); } }}>
          <SelectTrigger aria-label="Sort workload" className="h-10 min-w-0"><SelectValue>{sort === "desc" ? "Highest points" : "Lowest points"}</SelectValue></SelectTrigger>
          <SelectContent><SelectItem value="desc">Highest points</SelectItem><SelectItem value="asc">Lowest points</SelectItem></SelectContent>
        </Select>
      </div>
      <DashboardState pending={query.isPending} error={query.error} onRetry={() => void query.refetch()}>
        <table className="w-full table-fixed text-sm">
          <thead className="border-b-2 border-border bg-muted/40 text-left text-xs">
            <tr>
              <th scope="col" className="p-3">Member</th>
              <th scope="col" className="hidden w-20 p-3 text-right md:table-cell">Active</th>
              <th scope="col" className="hidden w-24 p-3 text-right md:table-cell">Est. pts</th>
              <th scope="col" className="hidden w-24 p-3 text-right lg:table-cell">Approved</th>
              <th scope="col" className="w-24 p-2 sm:w-32 sm:p-3">Workload</th>
              <th scope="col" className="w-10"><span className="sr-only"><span className="system-copy">Details</span></span></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {rows.map(({ member, active_tasks, active_points, approved_points, status, unestimated_tasks }) => (
              <tr key={member.id} className="cursor-pointer hover:bg-muted/40" onClick={() => { setSelectedId(member.id); }}>
                <td className="p-3">
                  <div className="flex min-w-0 items-center gap-2">
                    <Avatar className="hidden sm:flex">
                      {member.avatar_url && <AvatarImage src={member.avatar_url} alt="" />}
                      <AvatarFallback>{member.name.split(/\s+/).slice(0, 2).map((part) => part.charAt(0)).join("").toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <span className="break-words font-semibold">{member.name}{!member.is_active && " (inactive)"}</span>
                      <p className="text-xs text-muted-foreground md:hidden">{active_tasks.length} active · {active_points} est. pts</p>
                      <p className="text-xs text-muted-foreground lg:hidden">{approved_points} approved pts</p>
                      {unestimated_tasks > 0 && <p className="text-xs text-muted-foreground">{unestimated_tasks} unestimated — workload may be understated</p>}
                    </div>
                  </div>
                </td>
                <td className="hidden p-3 text-right tabular-nums md:table-cell">{active_tasks.length}</td>
                <td className="hidden p-3 text-right tabular-nums md:table-cell">{active_points}</td>
                <td className="hidden p-3 text-right tabular-nums lg:table-cell">{approved_points}</td>
                <td className="p-2 sm:p-3"><WorkloadBadge status={status} /></td>
                <td><Button variant="ghost" size="icon-sm" aria-label={`View workload for ${member.name}`} onClick={(e) => { e.stopPropagation(); setSelectedId(member.id); }}><ChevronRightIcon /></Button></td>
              </tr>
            ))}
          </tbody>
        </table>
        {!rows.length && <p className="p-6 text-center text-sm text-muted-foreground"><span className="system-copy">No members found.</span></p>}
        <div className="px-3 sm:px-4">
          <Pagination total={filtered.length} limit={limit} offset={pageOffset} count={rows.length} onOffsetChange={setOffset} onLimitChange={(v) => { setLimit(v); setOffset(0); }} label="Member workload pagination" />
        </div>
      </DashboardState>
      <Sheet open={memberOpen && !!selected} onOpenChange={(open) => { if (!open) setMemberOpen(false); }} onOpenChangeComplete={(open) => { if (!open) { setSelectedId(null); if (nextTask) { onInspect(nextTask); setNextTask(null); } } }}>
        {selected && <SheetContent>
          <SheetHeader>
            <SheetTitle>{selected.member.name}</SheetTitle>
            <SheetDescription>{selected.active_tasks.length} active · {selected.active_points} estimated pts · {selected.approved_points} approved pts</SheetDescription>
          </SheetHeader>
          <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-4">
            <WorkloadBadge status={selected.status} />
            {selected.unestimated_tasks > 0 && <p className="mt-2 text-xs text-muted-foreground">{selected.unestimated_tasks} unestimated — workload may be understated</p>}
            <ul className="mt-3 divide-y divide-border">
              {selected.active_tasks.map((task) => <li key={task.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                <button type="button" className="min-w-0 flex-1 break-words text-left text-sm font-semibold hover:underline" onClick={() => { setNextTask(task.id); setMemberOpen(false); }}>
                  <span className="block font-mono text-xs text-muted-foreground">{task.code}</span>{task.title}
                </button>
                <div className="flex flex-wrap items-center gap-2"><DashboardTaskStatus task={task} /><DashboardTaskPoints task={task} /></div>
              </li>)}
            </ul>
            {!selected.active_tasks.length && <p className="py-3 text-sm text-muted-foreground"><span className="system-copy">No active tasks.</span></p>}
          </div>
        </SheetContent>}
      </Sheet>
    </section>
  );
}
