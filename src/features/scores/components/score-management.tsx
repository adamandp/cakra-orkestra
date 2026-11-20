"use client";

import { useEffect, useState } from "react";
import { Tabs as TabsPrimitive } from "@base-ui/react/tabs";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { TrophyIcon, HistoryIcon, ChevronDownIcon, UserRoundIcon } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MonthPicker } from "@/components/shared/month-picker";
import { Popover } from "@base-ui/react/popover";
import { Skeleton } from "@/components/ui/skeleton";
import { ProjectUserPicker } from "@/features/projects/components/project-user-picker";
import type { ProjectUser } from "@/interface/project.interface";
import { useAuth } from "@/providers/auth-provider";
import { getScoreError } from "../score.api";
import { getScoreMonth, SCORE_PAGE_SIZE } from "../score.constants";
import { useMyScore, useMyScoreHistory, useUserScore } from "../score.query";
import { ScoreLeaderboard } from "./score-leaderboard";
import { ScoreHistory } from "./score-history";
import { ScoreSummary } from "./score-summary";

function ScoreError({ error, onRetry }: { error: unknown; onRetry: () => void }) {
  return (
    <div role="alert" className="space-y-3 rounded-lg border-2 border-border p-6 text-center">
      <p className="text-sm text-destructive">{getScoreError(error)}</p>
      <Button variant="outline" onClick={onRetry}><span className="system-copy">Retry</span></Button>
    </div>
  );
}

export function ScoreManagement() {
  const { user } = useAuth();
  const [tab, setTab] = useState<"leaderboard" | "history">("leaderboard");
  const [month, setMonth] = useState(getScoreMonth);
  const [offset, setOffset] = useState(0);
  const [pageSize, setPageSize] = useState(SCORE_PAGE_SIZE);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [selected, setSelected] = useState<ProjectUser[]>([]);
  const viewerId = user?.id ?? "";
  const target = user?.role === "ADMIN" ? selected[0] : undefined;
  const isPersonal = !target || target.id === viewerId;
  const params = { month, limit: pageSize, offset };
  const personalQuery = useMyScore(viewerId, { month }, isPersonal);
  const historyQuery = useMyScoreHistory(
    viewerId, params, isPersonal, personalQuery.data?.has_running_assessments ?? false,
  );
  const memberQuery = useUserScore(viewerId, target?.id ?? "", params, !isPersonal && user?.role === "ADMIN");
  const rawSummary = isPersonal ? personalQuery.data : memberQuery.data?.summary;
  const rawHistory = isPersonal ? historyQuery.data : memberQuery.data?.history;
  const targetName = isPersonal ? user?.name : target?.name;
  const targetId = isPersonal ? viewerId : target?.id;
  const [snapshot, setSnapshot] = useState<{ viewerId: string; targetId: string | undefined; name: string | undefined; month: string; summary: NonNullable<typeof rawSummary>; history: NonNullable<typeof rawHistory> } | null>(null);
  useEffect(() => {
    if (rawSummary && rawHistory) setSnapshot({ viewerId, targetId, name: targetName, month, summary: rawSummary, history: rawHistory });
  }, [viewerId, targetId, targetName, month, rawSummary, rawHistory]);
  const previous = snapshot?.viewerId === viewerId ? snapshot : null;
  const transitioning = Boolean(previous && (!rawSummary || !rawHistory));
  const summary = transitioning ? previous?.summary : rawSummary;
  const history = transitioning ? previous?.history : rawHistory;
  const displayName = transitioning ? previous?.name : targetName;
  const summaryRevision = personalQuery.data?.approved_points;
  const completedRevision = personalQuery.data?.completed_tasks;
  const refetchHistory = historyQuery.refetch;

  // Refresh history once more when polling observes a new official score,
  // even if the running-assessment flag has just become false.
  useEffect(() => {
    if (isPersonal && viewerId && summaryRevision !== undefined) void refetchHistory();
  }, [isPersonal, viewerId, summaryRevision, completedRevision, refetchHistory]);

  const summaryQuery = isPersonal ? personalQuery : memberQuery;
  const activeHistoryQuery = isPersonal ? historyQuery : memberQuery;
  if (!user) return null;

  return (
    <div className="space-y-6">
      <PageHeader title="Leaderboard" description="Rank verified contributions across the team." />
      <Tabs value={tab} onValueChange={value => { if (value === "leaderboard" || value === "history") setTab(value); }} className="min-w-0 gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <TabsList aria-label="Score views" className="team-pulse-tabs relative isolate grid w-full grid-cols-2 gap-1 rounded-md border-2 border-border bg-muted/40 p-1.5 group-data-horizontal/tabs:h-auto sm:w-fit sm:gap-2">
          {[{value:"leaderboard",label:"Leaderboard",icon:TrophyIcon},{value:"history",label:"Score History",icon:HistoryIcon}].map(({value,label,icon:Icon}) => <TabsTrigger key={value} value={value} className="z-10 h-auto min-w-0 gap-2 rounded-[3px] border-2 border-transparent px-3 py-2.5 text-xs font-semibold text-muted-foreground hover:bg-background/60 hover:text-foreground sm:px-4 sm:text-sm"><Icon className="size-4 shrink-0"/>{label}</TabsTrigger>)}
          <TabsPrimitive.Indicator className="pointer-events-none absolute left-0 top-0 -z-0 h-(--active-tab-height) w-(--active-tab-width) translate-x-(--active-tab-left) translate-y-(--active-tab-top) rounded-[3px] border-2 border-border bg-[var(--yellow)] shadow-[2px_2px_0_var(--shadow-color)] transition-[translate,width,height] duration-250 ease-out motion-reduce:transition-none" />
        </TabsList>
        <div className="w-full self-stretch sm:w-44"><MonthPicker value={month} allowAll={false} align="end" className="!h-full min-h-12 shadow-neo-sm" onChange={value => { setMonth(value); setOffset(0); }} /></div>
      </div>
      <TabsContent value="leaderboard" keepMounted className="team-pulse-panel min-w-0"><ScoreLeaderboard key={month} viewerId={viewerId} month={month} /></TabsContent>
      <TabsContent value="history" keepMounted className="team-pulse-panel min-w-0 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0"><h2 className="text-lg font-bold">{displayName + "’s performance"}</h2><p className="text-xs text-muted-foreground"><span className="system-copy">Verified contributions in the selected month.</span></p></div>
        {user.role === "ADMIN" && <Popover.Root open={pickerOpen} onOpenChange={setPickerOpen}>
          <Popover.Trigger className="flex h-10 w-full min-w-0 items-center gap-2 rounded-[3px] border-2 border-border bg-background px-3 text-sm font-medium shadow-neo-sm sm:w-44"><UserRoundIcon className="size-4 shrink-0"/><span className="flex-1 truncate text-left">{isPersonal ? user.name : target?.name}</span><ChevronDownIcon className="size-4 shrink-0"/></Popover.Trigger>
          <Popover.Portal><Popover.Positioner align="end" sideOffset={8} className="z-50"><Popover.Popup className="w-80 max-w-[calc(100vw-24px)] space-y-2 rounded-[3px] border-2 border-border bg-popover !p-1 shadow-neo-card"><ProjectUserPicker simple label="Member score" activeOnly={false} selected={isPersonal ? [user] : selected} onChange={next=>{setSelected(next);setOffset(0);setPickerOpen(false);}} /></Popover.Popup></Popover.Positioner></Popover.Portal>
        </Popover.Root>}
      </div>
      {transitioning && !summaryQuery.isError && !activeHistoryQuery.isError && <p role="status" className="text-xs text-muted-foreground">Loading scores for {targetName}…</p>}
      {summaryQuery.isError ? (
        <ScoreError error={summaryQuery.error} onRetry={() => void summaryQuery.refetch()} />
      ) : summary ? (
        <ScoreSummary data={summary} />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-28 rounded-xl" />)}
        </div>
      )}
      {summary?.has_running_assessments && (
        <p role="status" className="text-sm text-muted-foreground"><span className="system-copy">Assessment processing. Scores will refresh automatically.</span></p>
      )}
      {activeHistoryQuery.isError ? (
        <ScoreError error={activeHistoryQuery.error} onRetry={() => void activeHistoryQuery.refetch()} />
      ) : history ? (
        <ScoreHistory disabled={transitioning} data={history} onOffsetChange={setOffset} onLimitChange={(size) => { setPageSize(size); setOffset(0); }} />
      ) : (
        <Skeleton className="h-64 rounded-xl" />
      )}
      </TabsContent>
      </Tabs>
    </div>
  );
}
