import type { Role } from "@/interface/auth.interface";

export interface UserRole {
  id: string;
  name: Role;
  description: string | null;
  created_at: string;
  updated_at: string;
}
