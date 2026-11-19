"use client";

import { Button } from "@/components/ui/button";
import { useAuth } from "@/providers/auth-provider";

export function AuthState() {
  const { loading, error, retry } = useAuth();
  return (
    <div className="grid h-dvh place-items-center p-6 text-center">
      {loading ? (
        <p role="status" className="font-bold">
          Checking your session...
        </p>
      ) : error ? (
        <div role="alert" className="space-y-3">
          <p className="font-bold">Unable to verify your session.</p>
          <Button onClick={retry}>Try again</Button>
        </div>
      ) : null}
    </div>
  );
}
