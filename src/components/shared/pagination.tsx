"use client";

import { ChevronLeftIcon, ChevronRightIcon, ChevronsLeftIcon, ChevronsRightIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const PAGE_SIZES = [5, 10, 20];

export function Pagination({ total, limit, offset, count, onOffsetChange, onLimitChange, disabled = false, label = "Pagination", compact = false }: {
  total: number;
  limit: number;
  offset: number;
  count: number;
  onOffsetChange: (offset: number) => void;
  onLimitChange?: (limit: number) => void;
  disabled?: boolean;
  label?: string;
  compact?: boolean;
}) {
  const pages = Math.max(1, Math.ceil(total / limit));
  const current = Math.min(pages, Math.floor(offset / limit) + 1);
  const sizes = [...new Set([...PAGE_SIZES, limit])].sort((a, b) => a - b);
  const range = count ? `${offset + 1}–${Math.min(total, offset + count)}` : "0";
  const controls = [
    { label: "First page", icon: ChevronsLeftIcon, offset: 0, disabled: offset === 0 },
    { label: "Previous page", icon: ChevronLeftIcon, offset: Math.max(0, offset - limit), disabled: offset === 0 },
    { label: "Next page", icon: ChevronRightIcon, offset: offset + limit, disabled: offset + limit >= total },
    { label: "Last page", icon: ChevronsRightIcon, offset: (pages - 1) * limit, disabled: offset === (pages - 1) * limit },
  ];
  if (compact) return (
    <nav aria-label={label} className="flex min-w-0 flex-wrap items-center justify-between gap-2 border-t border-border/30 pt-2 text-xs">
      <span aria-live="polite" className="text-muted-foreground">Showing {range} of {total}</span>
      <div className="flex min-w-0 items-center gap-1">
        {controls.slice(0, 2).map(({label, icon: Icon, offset, disabled: unavailable}) => (
          <Button key={label} type="button" variant="ghost" size="icon-xs" pressAnimation={false} aria-label={label} disabled={disabled || unavailable} onClick={() => onOffsetChange(offset)}><Icon /></Button>
        ))}
        <span className="whitespace-nowrap px-1 font-medium tabular-nums">{current} / {pages}</span>
        {controls.slice(2).map(({label, icon: Icon, offset, disabled: unavailable}) => (
          <Button key={label} type="button" variant="ghost" size="icon-xs" pressAnimation={false} aria-label={label} disabled={disabled || unavailable} onClick={() => onOffsetChange(offset)}><Icon /></Button>
        ))}
      </div>
    </nav>
  );
  return (
    <nav aria-label={label} className="grid w-full min-w-0 grid-cols-1 gap-2 py-3 sm:flex sm:flex-wrap sm:items-center sm:justify-between">
      <span aria-live="polite" className="text-xs text-muted-foreground">Showing {range} of {total}</span>
      <div className="flex min-w-0 flex-wrap items-center justify-between gap-3 sm:ml-auto">
        {onLimitChange && (
          <div className="flex items-center gap-2 whitespace-nowrap text-xs font-semibold">
            <span>Rows per page</span>
            <Select value={String(limit)} disabled={disabled} onValueChange={(value) => {
              const next = Number(value);
              if (sizes.includes(next)) onLimitChange(next);
            }}>
              <SelectTrigger size="sm" aria-label="Rows per page" className="min-w-16">
                <SelectValue>{limit}</SelectValue>
              </SelectTrigger>
              <SelectContent side="top" align="end">
                {sizes.map((size) => <SelectItem key={size} value={String(size)}>{size}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        )}
        <div className="grid w-full min-w-0 grid-cols-[auto_auto_minmax(0,1fr)_auto_auto] items-center gap-1.5 border-t border-border/40 pt-3 sm:flex sm:w-auto sm:border-0 sm:pt-0">
          {controls.slice(0, 2).map(({label, icon: Icon, offset, disabled: unavailable}) => (
            <Button key={label} type="button" variant="outline" size="icon-sm" className="size-9 sm:size-8" aria-label={label} disabled={disabled || unavailable} onClick={() => onOffsetChange(offset)}>
              <Icon />
            </Button>
          ))}
          <span className="px-3 whitespace-nowrap text-center text-xs font-semibold tabular-nums">Page {current} of {pages}</span>
          {controls.slice(2).map(({label, icon: Icon, offset, disabled: unavailable}) => (
            <Button key={label} type="button" variant="outline" size="icon-sm" className="size-9 sm:size-8" aria-label={label} disabled={disabled || unavailable} onClick={() => onOffsetChange(offset)}>
              <Icon />
            </Button>
          ))}
        </div>
      </div>
    </nav>
  );
}
