"use client";

import * as React from "react";
import { Button as ButtonPrimitive } from "@base-ui/react/button";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "cn";

const buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center rounded-[3px] border-2 border-transparent bg-clip-padding text-sm font-bold whitespace-nowrap transition-all outline-none select-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default:
          "border-border bg-primary text-primary-foreground shadow-neo-button hover:translate-x-px hover:translate-y-px hover:shadow-neo-hover active:translate-x-[4px] active:translate-y-[5px] active:shadow-none",
        outline:
          "border-border bg-background text-foreground shadow-neo-button hover:translate-x-px hover:translate-y-px hover:shadow-neo-hover active:translate-x-[4px] active:translate-y-[5px] active:shadow-none hover:bg-muted aria-expanded:bg-muted",
        secondary:
          "border-border bg-secondary text-secondary-foreground shadow-neo-button hover:translate-x-px hover:translate-y-px hover:shadow-neo-hover active:translate-x-[4px] active:translate-y-[5px] active:shadow-none aria-expanded:bg-secondary",
        ghost:
          "hover:bg-muted hover:text-foreground aria-expanded:bg-muted aria-expanded:text-foreground dark:hover:bg-muted/50",
        destructive:
          "border-border bg-destructive text-destructive-foreground shadow-neo-button hover:translate-x-px hover:translate-y-px hover:shadow-neo-hover active:translate-x-[4px] active:translate-y-[5px] active:shadow-none focus-visible:ring-destructive/20",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default:
          "h-10 gap-1.5 px-3 has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2",
        xs: "h-6 gap-1 rounded-[min(var(--radius-md),10px)] px-2 text-xs in-data-[slot=button-group]:rounded-[3px] has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 [&_svg:not([class*='size-'])]:size-3",
        sm: "h-8 gap-1 rounded-[min(var(--radius-md),12px)] px-2.5 text-[0.8rem] in-data-[slot=button-group]:rounded-[3px] has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 [&_svg:not([class*='size-'])]:size-3.5",
        lg: "h-12 gap-1.5 px-4 has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2",
        icon: "size-10",
        "icon-xs":
          "size-6 rounded-[min(var(--radius-md),10px)] in-data-[slot=button-group]:rounded-[3px] [&_svg:not([class*='size-'])]:size-3",
        "icon-sm":
          "size-8 rounded-[min(var(--radius-md),12px)] in-data-[slot=button-group]:rounded-[3px]",
        "icon-lg": "size-12",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

function Button({
  className,
  variant = "default",
  size = "default",
  onClickCapture,
  pressAnimation = true,
  ...props
}: ButtonPrimitive.Props & VariantProps<typeof buttonVariants> & { pressAnimation?: boolean }) {
  const timer = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const replaying = React.useRef(false);
  const [pressed, setPressed] = React.useState(false);
  React.useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);
  const raised = variant !== "ghost" && variant !== "link";

  return (
    <ButtonPrimitive
      data-slot="button"
      data-variant={variant}
      className={cn(buttonVariants({ variant, size, className }), !pressAnimation && "!translate-none !transition-none hover:!translate-none active:!translate-none")}
      {...props}
      data-pressing={pressed ? "" : undefined}
      data-raised={raised && pressAnimation ? "" : undefined}
      onClickCapture={(event) => {
        if (!pressAnimation || replaying.current || window.matchMedia("(prefers-reduced-motion: reduce)").matches || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
          onClickCapture?.(event);
          return;
        }
        event.preventDefault();
        event.stopPropagation();
        if (timer.current || props.disabled) return;
        const element = event.currentTarget;
        setPressed(true);
        timer.current = setTimeout(() => {
          timer.current = null;
          replaying.current = true;
          try {
            if (element.isConnected && !element.matches(":disabled, [aria-disabled=true]")) element.click();
          } finally {
            replaying.current = false;
            setPressed(false);
          }
        }, 80);
      }}
    />
  );
}

export { Button, buttonVariants };
