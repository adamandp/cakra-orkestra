import type { ActivityLog } from "@/interface/activity-log.interface";
const KEY = "cakra-orkestra:activity-logs:v1";
export function getActivityLogs(): ActivityLog[] {
  try { return JSON.parse(localStorage.getItem(KEY) ?? "[]"); } catch { return []; }
}
export function appendActivityLog(input: Omit<ActivityLog,"id"|"created_at">) {
  localStorage.setItem(KEY, JSON.stringify([{...input,id:crypto.randomUUID(),created_at:new Date().toISOString()},...getActivityLogs()]));
}
