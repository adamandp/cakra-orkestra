export interface ActivityLog {
  id: string;
  actor_id: string | null;
  actor_name: string;
  actor_role: string | null;
  action: string;
  resource: string;
  resource_id: string | null;
  target: string | null;
  changed_fields: string[];
  message: string;
  outcome: "SUCCESS" | "FAILED";
  created_at: string;
}
export interface ActivityLogParams { q?: string; resource?: string; resource_id?: string; limit: number; offset: number }
export interface ActivityLogList { items: ActivityLog[]; total: number; limit: number; offset: number }
