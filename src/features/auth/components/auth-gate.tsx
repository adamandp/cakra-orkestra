"use client";

import { useEffect, type ReactNode } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/providers/auth-provider";
import { AuthState } from "./auth-state";
import { canAccessRoute } from "@/components/layout/navigation";
import { Button } from "@/components/ui/button";

export function WorkspaceAuthGate({ children }: { children: ReactNode }) {
  const { user, loading, error } = useAuth();
  const router = useRouter();
  useEffect(() => {
    if (!loading && !error && !user) router.replace("/login");
  }, [user, loading, error, router]);

  if (loading || error) return <AuthState />;
  if (!user) return null;
  return <>{children}</>;
}

export function PublicRoute({ children }: { children: ReactNode }) {
  const { user, loading, error } = useAuth();
  const router = useRouter();
  useEffect(() => {
    if (!loading && !error && user) router.replace("/my-focus");
  }, [user, loading, error, router]);

  if (loading || error) return <AuthState />;
  if (user) return null;
  return <>{children}</>;
}

export function RouteAccessGate({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  if (!user) return null;
  if (!canAccessRoute(pathname, user.role))
    return (
      <div className="grid flex-1 place-items-center p-6 text-center">
        <div className="space-y-3">
          <h1 className="text-3xl font-black">Access denied</h1>
          <p className="text-muted-foreground">You do not have access to this page.</p>
          <Button onClick={() => router.replace("/my-focus")}>Back to My Focus</Button>
        </div>
      </div>
    );
  return <>{children}</>;
}
