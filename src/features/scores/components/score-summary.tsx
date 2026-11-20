import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import type { ScoreSummary as ScoreSummaryData } from "@/interface/score.interface";

export function ScoreSummary({ data }: { data: ScoreSummaryData }) {
  const cards = [
    { title: "Approved points", value: data.approved_points, description: "Final points this month" },
    { title: "Completed tasks", value: data.completed_tasks, description: "Verified tasks this month" },
    { title: "Potential points", value: data.potential_points, description: "Current active task estimates" },
    { title: "Active tasks", value: data.active_tasks, description: "Current workload, all dates" },
  ];
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {cards.map((item) => (
        <Card key={item.title}>
          <CardHeader><CardTitle>{item.title}</CardTitle></CardHeader>
          <CardContent className="space-y-1">
            <p className="text-3xl font-black tabular-nums">{item.value}</p>
            <CardDescription>{item.description}</CardDescription>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
