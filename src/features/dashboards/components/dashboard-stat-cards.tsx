import type { LucideIcon } from "lucide-react";

type StatTone = "blue" | "yellow" | "mint" | "purple" | "pink";
const tones: Record<StatTone, string> = {
  blue: "bg-blue",
  yellow: "bg-yellow",
  mint: "bg-mint",
  purple: "bg-purple",
  pink: "bg-pink",
};

export interface DashboardStat {
  label: string;
  value: string | number;
  description: string;
  icon: LucideIcon;
  tone?: StatTone;
}

export function DashboardStatCards({ stats }: { stats: DashboardStat[] }) {
  const defaults: StatTone[] = ["blue", "yellow", "mint", "purple"];
  return (
    <div
      className={`grid grid-cols-2 gap-3 pb-2 pr-2 sm:gap-5 ${stats.length === 3 ? "@min-[640px]/main:grid-cols-3" : "@min-[940px]/main:grid-cols-4"}`}
    >
      {stats.map(({ label, value, description, icon: Icon, tone }, index) => {
        const points = typeof value === "string" && value.endsWith(" pts");
        return (
          <article
            key={label}
            data-slot="dashboard-stat-card"
            data-stat-tone={tone ?? defaults[index % 4]}
            className={`grid min-w-0 grid-rows-[auto_auto_1fr] content-start gap-1.5 border-2 border-[#10121a] p-2.5 sm:p-3 text-[#10121a] shadow-neo-card ${tones[tone ?? defaults[index % 4]]}`}
          >
            <div className="flex min-h-8 items-start justify-between gap-2 sm:min-h-9">
              <h2 className="text-xs leading-tight font-extrabold sm:text-sm">{label}</h2>
              <Icon aria-hidden className="size-4 shrink-0 sm:size-5" />
            </div>
            <p className="flex h-8 items-baseline whitespace-nowrap text-2xl sm:h-12 sm:text-[2.75rem] leading-none font-black tabular-nums tracking-normal">
              {points ? value.slice(0, -4) : value}
              {points && <span className="ml-1 text-xs sm:text-base tracking-tight"><span className="system-copy">pts</span></span>}
            </p>
            <p className="min-w-0 self-start text-[10px] leading-snug font-medium sm:text-xs">
              {description}
            </p>
          </article>
        );
      })}
    </div>
  );
}
