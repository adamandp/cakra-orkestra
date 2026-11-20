"use client";

import { Pagination } from "@/components/shared/pagination";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { ScoreHistoryResponse } from "@/interface/score.interface";
import { formatScoreDate } from "../score.constants";

export function ScoreHistory({ data, onOffsetChange, onLimitChange, disabled = false }: {
  data: ScoreHistoryResponse;
  disabled?: boolean;
  onOffsetChange: (offset: number) => void;
  onLimitChange: (limit: number) => void;
}) {
  return (
    <Card className="min-w-0 gap-0 overflow-hidden py-0">
      <CardHeader className="border-b-2 border-border px-4 py-3">
        <CardTitle><span className="system-copy">Score history</span></CardTitle>
        <CardDescription>Completed tasks with verified final assessments. Dates shown in WIB.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-0 p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Task</TableHead>
              <TableHead className="hidden md:table-cell">Project</TableHead>
              <TableHead>Tier</TableHead>
              <TableHead className="hidden sm:table-cell">Completed at</TableHead>
              <TableHead className="text-right">Points</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.items.map((item) => (
              <TableRow key={item.task_id}>
                <TableCell className="max-w-64 whitespace-normal">
                  <p className="font-medium">{item.title}</p>
                  <p className="text-xs text-muted-foreground">{item.code}</p><p className="text-xs text-muted-foreground md:hidden">{item.project_name}</p><p className="text-xs text-muted-foreground sm:hidden">{formatScoreDate(item.completed_at)}</p>
                </TableCell>
                <TableCell className="hidden md:table-cell">{item.project_name}</TableCell>
                <TableCell><Badge variant="outline">{item.tier}</Badge></TableCell>
                <TableCell className="hidden sm:table-cell">{formatScoreDate(item.completed_at)}</TableCell>
                <TableCell className="text-right font-bold tabular-nums">+{item.points}</TableCell>
              </TableRow>
            ))}
            {!data.items.length && (
              <TableRow><TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                No verified tasks on this page for the selected month.
              </TableCell></TableRow>
            )}
          </TableBody>
        </Table>
        <div className="px-4"><Pagination disabled={disabled} total={data.total} limit={data.limit} offset={data.offset} count={data.items.length} onOffsetChange={onOffsetChange} onLimitChange={onLimitChange} /></div>
      </CardContent>
    </Card>
  );
}
