"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { ScoreHistoryResponse } from "@/interface/score.interface";
import { formatScoreDate } from "../score.constants";

export function ScoreHistory({ data, onOffsetChange }: {
  data: ScoreHistoryResponse;
  onOffsetChange: (offset: number) => void;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Score history</CardTitle>
        <CardDescription>Completed tasks with verified final assessments. Dates shown in WIB.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Task</TableHead>
              <TableHead>Project</TableHead>
              <TableHead>Tier</TableHead>
              <TableHead>Completed at</TableHead>
              <TableHead className="text-right">Points</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.items.map((item) => (
              <TableRow key={item.task_id}>
                <TableCell className="min-w-48 whitespace-normal">
                  <p className="font-medium">{item.title}</p>
                  <p className="text-xs text-muted-foreground">{item.code}</p>
                </TableCell>
                <TableCell>{item.project_name}</TableCell>
                <TableCell><Badge variant="outline">{item.tier}</Badge></TableCell>
                <TableCell>{formatScoreDate(item.completed_at)}</TableCell>
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
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="text-sm text-muted-foreground">{data.total} completed tasks</span>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={data.offset === 0}
              onClick={() => onOffsetChange(Math.max(0, data.offset - data.limit))}>Previous</Button>
            <Button variant="outline" size="sm" disabled={data.offset + data.limit >= data.total}
              onClick={() => onOffsetChange(data.offset + data.limit)}>Next</Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
