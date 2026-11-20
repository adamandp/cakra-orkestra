"use client";

import * as React from "react";
import { Dialog as SheetPrimitive } from "@base-ui/react/dialog";
import { cn } from "cn";
import { animate, useReducedMotion } from "motion/react";

import { Button } from "@/components/ui/button";
import { GripVerticalIcon, XIcon } from "lucide-react";

const SheetDismissContext = React.createContext<((handler: (() => boolean) | null) => void) | null>(null);

function Sheet({ onOpenChange, ...props }: SheetPrimitive.Root.Props) {
  const dismiss = React.useRef<(() => boolean) | null>(null);
  const registerDismiss = React.useCallback((handler: (() => boolean) | null) => { dismiss.current = handler; }, []);
  return (
    <SheetDismissContext.Provider value={registerDismiss}>
      <SheetPrimitive.Root
        data-slot="sheet"
        {...props}
        onOpenChange={(open, details) => {
          if (!open && details.reason === "outside-press" && dismiss.current?.()) {
            details.cancel();
            return;
          }
          onOpenChange?.(open, details);
        }}
      />
    </SheetDismissContext.Provider>
  );
}

// For conditionally mounted feature sheets, keep the component alive until the
// shared exit transition finishes. All callers use the same lifecycle.
export function useSheetLifecycle(onDismiss: () => void) {
  const [open, setOpen] = React.useState(false);
  const afterClose = React.useRef<(() => void) | null>(null);
  React.useEffect(() => {
    const frame = requestAnimationFrame(() => setOpen(true));
    return () => cancelAnimationFrame(frame);
  }, []);
  const close = () => setOpen(false);
  const closeThen = (callback: () => void) => {
    afterClose.current = callback;
    setOpen(false);
  };
  const onOpenChangeComplete = (value: boolean) => {
    if (value) return;
    const callback = afterClose.current ?? onDismiss;
    afterClose.current = null;
    callback();
  };
  return { open, close, closeThen, onOpenChangeComplete };
}

function SheetTrigger({ ...props }: SheetPrimitive.Trigger.Props) {
  return <SheetPrimitive.Trigger data-slot="sheet-trigger" {...props} />;
}

function SheetClose({ ...props }: SheetPrimitive.Close.Props) {
  return <SheetPrimitive.Close data-slot="sheet-close" {...props} />;
}

function SheetPortal({ ...props }: SheetPrimitive.Portal.Props) {
  return <SheetPrimitive.Portal data-slot="sheet-portal" {...props} />;
}

function SheetOverlay({ className, ...props }: SheetPrimitive.Backdrop.Props) {
  return (
    <SheetPrimitive.Backdrop
      data-slot="sheet-overlay"
      className={cn(
        "fixed inset-0 z-50 bg-black/25 transition-opacity duration-450 ease-out motion-reduce:transition-none data-ending-style:opacity-0 data-starting-style:opacity-0 backdrop-blur-sm",
        className,
      )}
      {...props}
    />
  );
}

const SHEET_DESKTOP_QUERY = "(min-width: 64rem)";

function subscribeSheetViewport(onChange: () => void) {
  const media = window.matchMedia(SHEET_DESKTOP_QUERY);
  media.addEventListener("change", onChange);
  return () => media.removeEventListener("change", onChange);
}

function SheetContent({
  className,
  children,
  side,
  showCloseButton = true,
  preventDragDismiss = false,
  ...props
}: SheetPrimitive.Popup.Props & {
  side?: "top" | "right" | "bottom" | "left";
  showCloseButton?: boolean;
  preventDragDismiss?: boolean;
}) {
  const isDesktop = React.useSyncExternalStore(
    subscribeSheetViewport,
    () => window.matchMedia(SHEET_DESKTOP_QUERY).matches,
    () => true,
  );
  const resolvedSide = side ?? (isDesktop ? "right" : "bottom");
  const isBottom = side === undefined && !isDesktop;
  const isResizable = isDesktop && resolvedSide === "right";
  const [isResizing, setIsResizing] = React.useState(false);
  const [sheetWidth, setSheetWidth] = React.useState<number | null>(null);
  const resizeStart = React.useRef<{ x: number; width: number } | null>(null);
  const boundWidth = (width: number) => Math.min(960, window.innerWidth * 0.8, Math.max(384, width));
  const [expanded, setExpanded] = React.useState(false);
  const dragStart = React.useRef<{ y: number; height: number } | null>(null);
  const [dragHeight, setDragHeight] = React.useState<number | null>(null);

  const closeRef = React.useRef<HTMLButtonElement>(null);
  const animation = React.useRef<ReturnType<typeof animate> | null>(null);
  const reducedMotion = useReducedMotion();
  React.useEffect(() => () => animation.current?.stop(), []);

  const dismissRequest = React.useContext(SheetDismissContext);
  const popupRef = React.useRef<HTMLDivElement>(null);
  const dismissing = React.useRef(false);
  const [dismissProgress, setDismissProgress] = React.useState(0);

  const dismissDrag = React.useCallback((height: number) => {
    if (dismissing.current) return;
    dismissing.current = true;
    dragStart.current = null;
    animation.current?.stop();
    setDragHeight(height);
    animation.current = animate(0, 1, {
      duration: reducedMotion ? 0 : 0.45,
      ease: "easeOut",
      onUpdate: setDismissProgress,
      onComplete: () => closeRef.current?.click(),
    });
  }, [reducedMotion]);

  React.useEffect(() => {
    if (!dismissRequest || !isBottom || preventDragDismiss) return;
    dismissRequest(() => {
      const height = popupRef.current?.getBoundingClientRect().height;
      if (!height) return false;
      dismissDrag(height);
      return true;
    });
    return () => dismissRequest(null);
  }, [dismissRequest, isBottom, dismissDrag, preventDragDismiss]);

  function finishDrag(event: React.PointerEvent<HTMLButtonElement>) {
    const start = dragStart.current;
    if (!start) return;
    const viewport = window.visualViewport?.height ?? window.innerHeight;
    const delta = event.clientY - start.y;
    const height = Math.max(0, start.height - delta);
    if (delta >= start.height * 0.4 && !preventDragDismiss) { dismissDrag(height); return; }
    const nextExpanded = delta < -20 || (expanded && delta < 20);
    const target = viewport * (nextExpanded ? 0.96 : 0.75);
    dragStart.current = null;
    animation.current?.stop();
    animation.current = animate(height, target, {
      duration: reducedMotion ? 0 : 0.28,
      ease: "easeOut",
      onUpdate: setDragHeight,
      onComplete: () => {
        setExpanded(nextExpanded);
        setDragHeight(null);
      },
    });
  }

  return (
    <SheetPortal>
      <SheetOverlay style={dismissProgress > 0 ? { opacity: 1 - dismissProgress } : undefined} />
      <SheetPrimitive.Popup
        ref={popupRef}
        data-slot="sheet-content"
        data-side={resolvedSide}
        className={cn(
          "fixed z-50 flex flex-col gap-4 bg-popover bg-clip-padding text-sm text-popover-foreground shadow-lg transition-[translate,opacity] duration-450 ease-out data-ending-style:opacity-0 data-starting-style:opacity-0 data-[side=bottom]:inset-x-0 data-[side=bottom]:bottom-0 data-[side=bottom]:h-auto data-[side=bottom]:border-t data-[side=bottom]:data-ending-style:translate-y-full data-[side=bottom]:data-starting-style:translate-y-full data-[side=left]:inset-y-0 data-[side=left]:left-0 data-[side=left]:h-full data-[side=left]:w-3/4 data-[side=left]:border-r data-[side=left]:data-ending-style:-translate-x-full data-[side=left]:data-starting-style:-translate-x-full data-[side=right]:inset-y-0 data-[side=right]:right-0 data-[side=right]:h-full data-[side=right]:w-3/4 data-[side=right]:border-l data-[side=right]:data-ending-style:translate-x-full data-[side=right]:data-starting-style:translate-x-full data-[side=right]:duration-450 data-[side=right]:ease-out data-[side=right]:transition-[translate] data-[side=right]:data-starting-style:opacity-100 data-[side=right]:data-ending-style:opacity-100 motion-reduce:transition-none data-[side=top]:inset-x-0 data-[side=top]:top-0 data-[side=top]:h-auto data-[side=top]:border-b data-[side=top]:data-ending-style:-translate-y-full data-[side=top]:data-starting-style:-translate-y-full data-[side=left]:sm:max-w-sm data-[side=right]:sm:max-w-sm",
          className,
          isBottom &&
            "w-full max-w-none sm:max-w-none min-h-0 overflow-hidden gap-0 data-[side=bottom]:duration-450 data-[side=bottom]:ease-out data-[side=bottom]:transition-[translate,height] data-[side=bottom]:data-starting-style:opacity-100 data-[side=bottom]:data-ending-style:opacity-100 motion-reduce:transition-none",
          isBottom && (expanded ? "data-[side=bottom]:h-[96dvh]" : "data-[side=bottom]:h-[75dvh]"),
          isBottom && (dragHeight !== null || dismissProgress > 0) && "data-[side=bottom]:duration-0 data-[side=bottom]:data-ending-style:duration-450",
        )}
        {...props}
        style={{
          ...props.style,
          ...(isBottom && dragHeight !== null ? { height: dragHeight } : {}),
          ...(isBottom && dismissProgress > 0 ? { translate: `0 ${dismissProgress * 110}%` } : {}),
          ...(isResizable ? { width: sheetWidth ?? 528, maxWidth: "min(960px, 80vw)" } : {}),
        }}
      >
        {isResizable && (
          <button
            type="button"
            aria-label="Resize side sheet"
            title="Drag to resize; double-click to reset"
            className="group/resize absolute inset-y-0 left-0 z-10 flex w-5 -translate-x-full touch-none cursor-ew-resize items-center justify-center outline-none focus-visible:outline-none"
            onPointerDown={(event) => {
              const width = event.currentTarget.parentElement?.getBoundingClientRect().width;
              if (!width) return;
              resizeStart.current = { x: event.clientX, width };
              setIsResizing(true);
              event.currentTarget.setPointerCapture(event.pointerId);
            }}
            onPointerMove={(event) => {
              const start = resizeStart.current;
              if (start) setSheetWidth(boundWidth(start.width + start.x - event.clientX));
            }}
            onPointerUp={() => { resizeStart.current = null; setIsResizing(false); }}
            onPointerCancel={() => { resizeStart.current = null; setIsResizing(false); }}
            onLostPointerCapture={() => { resizeStart.current = null; setIsResizing(false); }}
            onDoubleClick={() => setSheetWidth(null)}
            onKeyDown={(event) => {
              if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
              event.preventDefault();
              const width = event.currentTarget.parentElement?.getBoundingClientRect().width ?? 512;
              setSheetWidth(boundWidth(width + (event.key === "ArrowLeft" ? 32 : -32)));
            }}
          >
            <span className={cn("flex h-12 w-6 shrink-0 items-center justify-center border-2 border-border bg-popover shadow-neo-button transition-[translate,box-shadow,background-color] group-hover/resize:bg-primary", isResizing && "translate-y-1 bg-primary shadow-neo-active")}>
              <GripVerticalIcon className="size-4" aria-hidden="true" />
            </span>
            <span aria-hidden="true" className="pointer-events-none absolute right-7 whitespace-nowrap border-2 border-border bg-popover px-2 py-1 text-xs font-bold opacity-0 shadow-neo-button transition-opacity group-hover/resize:opacity-100 group-focus-visible/resize:opacity-100">
              Drag to resize
            </span>
          </button>
        )}
        {isBottom && (
          <button
            type="button"
            aria-label={expanded ? "Collapse sheet" : "Expand sheet"}
            aria-expanded={expanded}
            className="flex h-7 w-full shrink-0 touch-none cursor-grab items-center justify-center border-b-2 border-border bg-popover active:cursor-grabbing"
            onPointerDown={(event) => {
              if (dismissing.current) return;
              const height = event.currentTarget.parentElement?.getBoundingClientRect().height;
              if (!height) return;
              animation.current?.stop();
              dragStart.current = { y: event.clientY, height };
              event.currentTarget.setPointerCapture(event.pointerId);
            }}
            onPointerMove={(event) => {
              const start = dragStart.current;
              if (!start) return;
              const viewport = window.visualViewport?.height ?? window.innerHeight;
              const delta = event.clientY - start.y;
              const height = Math.min(viewport * 0.96, Math.max(0, start.height - delta));
              if (delta >= start.height * 0.4 && !preventDragDismiss) {
                dismissDrag(height);
                return;
              }
              setDragHeight(height);
            }}
            onPointerUp={finishDrag}
            onPointerCancel={() => { dragStart.current = null; if (!dismissing.current) setDragHeight(null); }}
            onClick={(event) => { if (event.detail === 0) setExpanded((value) => !value); }}
          >
            <span className="h-1.5 w-12 rounded-full bg-foreground/60" />
          </button>
        )}
        {children}
        {isBottom && <SheetPrimitive.Close ref={closeRef} className="hidden" />}
        {showCloseButton && (
          <SheetPrimitive.Close
            data-slot="sheet-close"
            render={<Button variant="ghost" className={cn("absolute top-3 right-3", isBottom && "top-10")} size="icon-sm" />}
          >
            <XIcon />
            <span className="sr-only">Close</span>
          </SheetPrimitive.Close>
        )}
      </SheetPrimitive.Popup>
    </SheetPortal>
  );
}

function SheetHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="sheet-header"
      className={cn("flex flex-col gap-0.5 p-4", className)}
      {...props}
    />
  );
}

function SheetFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="sheet-footer"
      className={cn("mt-auto flex shrink-0 flex-row flex-wrap justify-end gap-3 bg-popover", className)}
      {...props}
    />
  );
}

function SheetTitle({ className, ...props }: SheetPrimitive.Title.Props) {
  return (
    <SheetPrimitive.Title
      data-slot="sheet-title"
      className={cn("font-heading text-base font-medium text-foreground", className)}
      {...props}
    />
  );
}

function SheetDescription({ className, ...props }: SheetPrimitive.Description.Props) {
  return (
    <SheetPrimitive.Description
      data-slot="sheet-description"
      className={cn("text-sm text-muted-foreground", className)}
      {...props}
    />
  );
}

export {
  Sheet,
  SheetTrigger,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetFooter,
  SheetTitle,
  SheetDescription,
};
