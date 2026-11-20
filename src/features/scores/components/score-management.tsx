"use client";

import { useEffect, useState } from "react";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { ProjectUserPicker } from "@/features/projects/components/project-user-picker";
import type { ProjectUser } from "@/interface/project.interface";
import { useAuth } from "@/providers/auth-provider";
import { getScoreError } from "../score.api";
import { getScoreMonth, SCORE_PAGE_SIZE } from "../score.constants";
import { useMyScore, useMyScoreHistory, useUserScore } from "../score.query";
import { ScoreHistory } from "./score-history";
import { ScoreSummary } from "./score-summary";

function ScoreError({ error, onRetry }: { error: unknown; onRetry: () => void }) {
  return (
    <div role="alert" className="space-y-3 rounded-lg border-2 border-border p-6 text-center">
      <p className="text-sm text-destructive">{getScoreError(error)}</p>
      <Button variant="outline" onClick={onRetry}>Retry</Button>
    </div>
  );
}

export function ScoreManagement() {
  const { user } = useAuth();
  const [month, setMonth] = useState(getScoreMonth);
  const [offset, setOffset] = useState(0);
  const [selected, setSelected] = useState<ProjectUser[]>([]);
  const viewerId = user?.id ?? "";
  const target = user?.role === "ADMIN" ? selected[0] : undefined;
  const isPersonal = !target || target.id === viewerId;
  const params = { month, limit: SCORE_PAGE_SIZE, offset };
  const personalQuery = useMyScore(viewerId, { month }, isPersonal);
  const historyQuery = useMyScoreHistory(
    viewerId, params, isPersonal, personalQuery.data?.has_running_assessments ?? false,
  );
  const memberQuery = useUserScore(viewerId, target?.id ?? "", params, !isPersonal && user?.role === "ADMIN");
  const summary = isPersonal ? personalQuery.data : memberQuery.data?.summary;
  const history = isPersonal ? historyQuery.data : memberQuery.data?.history;
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
      <PageHeader title="Scores" description="Track verified contributions and assessment results." />
      <Card>
        <CardHeader><CardTitle>Score filters</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="max-w-xs space-y-2">
            <Label htmlFor="score-month">Month (WIB)</Label>
            <Input id="score-month" type="month" value={month} onChange={(event) => {
              if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(event.target.value)) return;
              setMonth(event.target.value);
              setOffset(0);
            }} />
          </div>
          {user.role === "ADMIN" && (
            <ProjectUserPicker label="Member score" activeOnly={false} selected={selected}
              onChange={(next) => { setSelected(next); setOffset(0); }} />
          )}
          <p className="text-sm text-muted-foreground">
            Showing {isPersonal ? "your own score" : `${target?.name ?? "Selected user"}'s score`}.
            Potential points reflect current workload, regardless of the selected month.
          </p>
        </CardContent>
      </Card>
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
        <p role="status" className="text-sm text-muted-foreground">Assessment processing. Scores will refresh automatically.</p>
      )}
      {activeHistoryQuery.isError ? (
        <ScoreError error={activeHistoryQuery.error} onRetry={() => void activeHistoryQuery.refetch()} />
      ) : history ? (
        <ScoreHistory data={history} onOffsetChange={setOffset} />
      ) : (
        <Skeleton className="h-64 rounded-xl" />
      )}
    </div>
  );
}
