import type { ReactNode } from "react";

interface PageHeaderProps {
  title: string;
  description?: string;
  actions?: ReactNode;
  detail?: boolean;
}

export function PageHeader({ title, description, actions }: PageHeaderProps) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 sm:gap-4 border-b-[3px] border-border pb-4 sm:pb-5">
      <div className="min-w-0 flex-1 basis-64 space-y-1.5">
        <h1 className="break-words text-3xl sm:text-4xl lg:text-5xl leading-[1.12] font-black uppercase tracking-[-0.015em] word-spacing-[0.06em]">{title}</h1>
        {description && <p className="text-sm leading-relaxed text-muted-foreground">{description}</p>}
      </div>
      {actions && <div className="flex shrink-0 flex-wrap items-center gap-2 [&_button]:h-10 [&_a]:h-10 [&_button]:px-3 [&_a]:px-3 [&_button]:text-sm [&_a]:text-sm">{actions}</div>}
    </div>
  );
}
