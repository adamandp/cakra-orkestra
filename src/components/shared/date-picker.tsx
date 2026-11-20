"use client";
import { DateTimePicker } from "./date-time-picker";
import type { ComponentProps } from "react";
export function DatePicker(props: Omit<ComponentProps<typeof DateTimePicker>, "mode">) {
  return <DateTimePicker {...props} mode="date" />;
}
