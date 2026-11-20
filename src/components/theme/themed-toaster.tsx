"use client";

import { useTheme } from "next-themes";
import { Toaster } from "sonner";

export function ThemedToaster() {
  const { resolvedTheme } = useTheme();

  return (
    <Toaster
      position="bottom-right"
      closeButton
      swipeDirections={["bottom", "right"]}
      richColors
      theme={resolvedTheme === "dark" ? "dark" : resolvedTheme === "light" ? "light" : "system"}
    />
  );
}
