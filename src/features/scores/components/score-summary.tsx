import { ActivityIcon, CheckCircle2Icon, ClockIcon, SparklesIcon } from "lucide-react";
import { type DashboardStat } from "@/features/dashboards/components/dashboard-stat-cards";
import { Card } from "@/components/ui/card";
import type { ScoreSummary as ScoreSummaryData } from "@/interface/score.interface";

export function ScoreSummary({ data }: { data: ScoreSummaryData }) {
  const cards: DashboardStat[] = [
    { label: "Approved points", value: `${data.approved_points} pts`, description: "Final points this month", icon: SparklesIcon, tone: "mint" },
    { label: "Completed tasks", value: data.completed_tasks, description: "Verified tasks this month", icon: CheckCircle2Icon, tone: "purple" },
    { label: "Potential points", value: `${data.potential_points} pts`, description: "Current active task estimates", icon: ClockIcon, tone: "yellow" },
    { label: "Active tasks", value: data.active_tasks, description: "Current workload, all dates", icon: ActivityIcon, tone: "blue" },
  ];
  return <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">{cards.map(({label,value,description,icon:Icon,tone}) => <Card key={label} data-stat-tone={tone} className="min-w-0 gap-2 p-4"><div className="flex items-center justify-between gap-2 text-xs font-medium text-muted-foreground"><span>{label}</span><Icon className="size-4 shrink-0"/></div><p className="text-2xl font-black tabular-nums">{value}</p><p className="text-xs text-muted-foreground">{description}</p></Card>)}</div>;
}
