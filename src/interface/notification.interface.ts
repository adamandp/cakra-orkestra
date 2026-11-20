export interface Notification {
  id: string;
  user_id: string;
  actor_id: string | null;
  type: string;
  title: string;
  message: string;
  entity_type: "task" | "project" | "changelog" | "attendance";
  entity_id: string;
  read_at: string | null;
  created_at: string;
}
export interface NotificationList { items: Notification[]; total: number; limit: number; offset: number }
