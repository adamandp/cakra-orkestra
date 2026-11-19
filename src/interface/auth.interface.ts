export type Role = "ADMIN" | "MEMBER";

export interface AuthUser {
  id: string;
  username: string;
  name: string;
  role: Role;
  avatar_url: string | null;
  is_active: boolean;
}

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface AccessTokenResponse {
  accessToken: string;
}

export interface ChangePasswordInput {
  current_password: string;
  new_password: string;
}
