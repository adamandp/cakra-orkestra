"use client";
import { useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { axiosInstance } from "@/lib/axios";
import { useAuth } from "@/providers/auth-provider";
import type { FocusReviewEvent } from "@/interface/dashboard.interface";

export function FocusReviews() {
  const { user } = useAuth();
  const seen = useRef<{ user: string; ids: Set<string> } | null>(null);
  const query = useQuery({
    queryKey: ["tasks", "list", "focus-reviews", user?.id],
    enabled: Boolean(user),
    refetchInterval: 5000,
    queryFn: async ({ signal }) =>
      (
        await axiosInstance.get<{ data: FocusReviewEvent[] }>("/dashboards/my-focus/reviews", {
          signal,
        })
      ).data.data,
  });
  useEffect(() => {
    if (!user || !query.data) return;
    const key = "cakra-orkestra:seen-reviews:" + user.id;
    if (seen.current?.user !== user.id) {
      let saved: string[] | null = null;
      try {
        saved = JSON.parse(localStorage.getItem(key) ?? "null");
      } catch {}
      seen.current = { user: user.id, ids: new Set(saved ?? query.data.map((e) => e.id)) };
    }
    for (const event of [...query.data].reverse()) {
      if (seen.current.ids.has(event.id)) continue;
      seen.current.ids.add(event.id);
      if (event.kind === "approved")
        toast.success("Task approved", { description: event.title, id: event.id });
      else
        toast.warning("Task requires revision", {
          description: event.title + (event.reason ? ": " + event.reason : ""),
          id: event.id,
        });
    }
    localStorage.setItem(key, JSON.stringify([...seen.current.ids]));
  }, [user, query.data]);
  return null;
}
