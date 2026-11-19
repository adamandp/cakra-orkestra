import type { AuthUser } from "@/interface/auth.interface";
import { mockUsers } from "./users";

const SESSION_KEY = "cakra-orkestra:mock-session:v1";
const ACCESS_LIFETIME = 15 * 60 * 1000;
const REFRESH_LIFETIME = 7 * 24 * 60 * 60 * 1000;

interface MockSession {
  userId: string;
  accessToken: string;
  refreshToken: string;
  accessExpiresAt: number;
  refreshExpiresAt: number;
}

function readSession(): MockSession | null {
  try {
    const value = localStorage.getItem(SESSION_KEY);
    return value ? (JSON.parse(value) as MockSession) : null;
  } catch {
    return null;
  }
}

function saveSession(session: MockSession) {
  // Simulated backend storage; this is not production token storage.
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

function clearMockSession() {
  localStorage.removeItem(SESSION_KEY);
}

export function revokeMockSession(refreshToken: string | undefined) {
  const session = readSession();
  if (session && refreshToken === session.refreshToken) clearMockSession();
}

export function createMockSession(userId: string): MockSession {
  const now = Date.now();
  const session: MockSession = {
    userId,
    accessToken: crypto.randomUUID(),
    refreshToken: crypto.randomUUID(),
    accessExpiresAt: now + ACCESS_LIFETIME,
    refreshExpiresAt: now + REFRESH_LIFETIME,
  };
  saveSession(session);
  return session;
}

export function refreshMockSession(refreshToken: string | undefined): MockSession | null {
  const session = readSession();
  if (!session || !refreshToken || session.refreshToken !== refreshToken) return null;
  if (
    session.refreshExpiresAt <= Date.now() ||
    !mockUsers.some((user) => user.id === session.userId && user.is_active)
  ) {
    clearMockSession();
    return null;
  }
  const updated = {
    ...session,
    accessToken: crypto.randomUUID(),
    accessExpiresAt: Date.now() + ACCESS_LIFETIME,
  };
  saveSession(updated);
  return updated;
}

export function getMockUser(request: Request): AuthUser | null {
  const session = readSession();
  if (
    !session ||
    session.accessExpiresAt <= Date.now() ||
    session.refreshExpiresAt <= Date.now() ||
    request.headers.get("Authorization") !== "Bearer " + session.accessToken
  )
    return null;
  const user = mockUsers.find((item) => item.id === session.userId && item.is_active);
  if (!user) return null;
  return {
    id: user.id,
    username: user.username,
    name: user.name,
    role: user.role,
    avatar_url: user.avatar_url,
    is_active: user.is_active,
  };
}

// Demo password overrides persist without changing the two seeded users.
function passwordKey(userId: string) {
  return "cakra-orkestra:mock-password:v1:" + userId;
}

async function hashDemoPassword(password: string) {
  const bytes = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(password));
  return Array.from(new Uint8Array(bytes), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

export async function matchesMockPassword(userId: string, password: string) {
  const user = mockUsers.find((item) => item.id === userId);
  if (!user) return false;
  const override = localStorage.getItem(passwordKey(userId));
  return override ? override === (await hashDemoPassword(password)) : user.password === password;
}

export async function updateMockPassword(userId: string, password: string) {
  localStorage.setItem(passwordKey(userId), await hashDemoPassword(password));
}
