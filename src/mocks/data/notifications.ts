import type { Notification } from "@/interface/notification.interface";
const KEY = "cakra-orkestra:notifications:v1";
export function getNotifications(): Notification[] {
  try { return JSON.parse(localStorage.getItem(KEY) ?? "[]"); } catch { return []; }
}
export function saveNotifications(items: Notification[]) { localStorage.setItem(KEY, JSON.stringify(items)); }
export function notify(users: string[], actor: string | null, type: string, title: string, message: string, entity_type: Notification["entity_type"], entity_id: string) {
  const items = [...new Set(users)].filter(id => id !== actor).map(user_id => ({
    id: crypto.randomUUID(), user_id, actor_id: actor, type, title, message, entity_type, entity_id, read_at: null, created_at: new Date().toISOString()
  }));
  if (items.length) saveNotifications([...items, ...getNotifications()]);
}
