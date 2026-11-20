import { Card, CardHeader, CardContent, CardTitle, CardDescription } from "@/components/ui/card";
import type { LucideIcon } from "lucide-react";

export interface DashboardStat {
  label: string;
  value: string | number;
  description: string;
  icon: LucideIcon;
}

export function DashboardStatCards({ stats }: { stats: DashboardStat[] }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {stats.map(({ label, value, description, icon: Icon }) => (
        <Card key={label} size="sm">
          <CardHeader className="flex flex-row items-center justify-between gap-2">
            <CardTitle>{label}</CardTitle>
            <Icon aria-hidden className="size-4 shrink-0 text-muted-foreground" />
          </CardHeader>
          <CardContent className="space-y-1">
            <p className="text-3xl font-black tabular-nums tracking-tight">{value}</p>
            <CardDescription className="text-xs">{description}</CardDescription>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
