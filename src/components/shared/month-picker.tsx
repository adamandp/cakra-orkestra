"use client";

import { pickerTrigger, pickerPopup, pickerNav } from "./picker-styles";
import { cn } from "cn";
import { useState } from "react";
import { Popover } from "@base-ui/react/popover";
import { CalendarDaysIcon, ChevronDownIcon, ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import { getScoreMonth } from "@/features/scores/score.constants";

const months = Array.from({ length: 12 }, (_, i) =>
  new Intl.DateTimeFormat("en", { month: "short", timeZone: "UTC" }).format(
    new Date(Date.UTC(2020, i, 1)),
  ),
);
export function MonthPicker({
  value,
  onChange,
  allowAll = true,
  className = "",
  align = "start",
}: {
  value: string;
  onChange: (value: string) => void;
  allowAll?: boolean;
  className?: string;
  align?: "start" | "end";
}) {
  const current = getScoreMonth();
  const [open, setOpen] = useState(false);
  const [year, setYear] = useState(Number((value || current).slice(0, 4)));
  const label = value ? months[Number(value.slice(5)) - 1] + " " + value.slice(0, 4) : "All months";
  function choose(next: string) {
    onChange(next);
    setOpen(false);
  }
  return (
    <Popover.Root
      open={open}
      onOpenChange={(next) => {
        if (next) setYear(Number((value || current).slice(0, 4)));
        setOpen(next);
      }}
    >
      <Popover.Trigger
        data-slot="month-picker-trigger"
        aria-label="Completion month (WIB)"
        className={cn(pickerTrigger,className)}
      >
        <CalendarDaysIcon className="size-4 shrink-0" />
        <span className="flex-1 truncate text-left">{label}</span>
        <ChevronDownIcon className="size-4 shrink-0" />
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Positioner sideOffset={8} align={align} className="z-50">
          <Popover.Popup
            data-slot="popover-content"
            className={cn(pickerPopup,"w-64")}
          >
            <div className="mb-3 flex items-center justify-between gap-2 border-b-2 border-border pb-2">
              <button
                type="button"
                aria-label="Previous year"
                onClick={() => setYear((y) => y - 1)}
                className={pickerNav}
              >
                <ChevronLeftIcon className="size-4" />
              </button>
              <span className="text-lg font-black tabular-nums">{year}</span>
              <button
                type="button"
                aria-label="Next year"
                onClick={() => setYear((y) => y + 1)}
                className={pickerNav}
              >
                <ChevronRightIcon className="size-4" />
              </button>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {months.map((name, i) => {
                const key = year + "-" + String(i + 1).padStart(2, "0");
                return (
                  <button
                    key={key}
                    type="button"
                    aria-pressed={value === key}
                    onClick={() => choose(key)}
                    className={`h-9 rounded-[3px] border-2 border-border text-xs font-bold focus-visible:outline-2 focus-visible:outline-ring ${value === key ? "bg-yellow text-[#10121a] shadow-neo-sm" : "bg-background hover:bg-accent hover:text-accent-foreground"}`}
                  >
                    {name}
                  </button>
                );
              })}
            </div>
            <div className={`mt-3 grid gap-2 border-t-2 border-border pt-3 ${allowAll ? "grid-cols-2" : "grid-cols-1"}`}>
              {allowAll && <button
                type="button"
                onClick={() => choose("")}
                className="h-8 border-2 border-border text-xs font-bold hover:bg-muted"
              >
                All months
              </button>}
              <button
                type="button"
                onClick={() => choose(current)}
                className="h-8 border-2 border-border bg-primary text-xs font-bold text-primary-foreground"
              >
                This month
              </button>
            </div>
            <p className="mt-2 text-center text-[10px] text-muted-foreground">Asia/Jakarta · WIB</p>
          </Popover.Popup>
        </Popover.Positioner>
      </Popover.Portal>
    </Popover.Root>
  );
}
