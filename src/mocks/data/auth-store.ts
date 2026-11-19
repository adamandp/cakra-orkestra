import type { AuthUser } from "@/interface/auth.interface";
import { findMockUser, toAuthUser } from "./users";

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

export function revokeMockSessionForUser(userId: string) {
  const session = readSession();
  if (session?.userId === userId) clearMockSession();
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
  if (session.refreshExpiresAt <= Date.now() || !findMockUser(session.userId)?.is_active) {
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

  const user = findMockUser(session.userId);
  return user?.is_active ? toAuthUser(user) : null;
}
