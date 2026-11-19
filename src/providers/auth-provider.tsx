"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { bootstrapAuth, login, logout } from "@/features/auth/auth.api";
import { onSessionExpired } from "@/lib/axios";
import type { AuthUser, LoginCredentials } from "@/interface/auth.interface";

interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
  error: boolean;
  retry: () => void;
  login: (input: LoginCredentials) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [attempt, setAttempt] = useState(0);

  useEffect(
    () =>
      onSessionExpired(() => {
        queryClient.clear();
        setUser(null);
      }),
    [queryClient],
  );

  useEffect(() => {
    let active = true;
    void bootstrapAuth()
      .then((profile) => {
        if (active) setUser(profile);
      })
      .catch(() => {
        if (active) setError(true);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [attempt]);

  function retry() {
    setError(false);
    setLoading(true);
    setAttempt((value) => value + 1);
  }

  async function handleLogin(input: LoginCredentials) {
    const profile = await login(input);
    await queryClient.cancelQueries();
    queryClient.clear();
    setUser(profile);
  }

  async function handleLogout() {
    await logout();
    await queryClient.cancelQueries();
    queryClient.clear();
    setUser(null);
  }

  return (
    <AuthContext.Provider
      value={{ user, loading, error, retry, login: handleLogin, logout: handleLogout }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside AuthProvider");
  return context;
}
