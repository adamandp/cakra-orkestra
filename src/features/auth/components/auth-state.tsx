"use client";

import { Button } from "@/components/ui/button";
import { useAuth } from "@/providers/auth-provider";

export function AuthState() {
  const { loading, error, retry } = useAuth();
  return (
    <div className="grid h-dvh place-items-center p-6 text-center">
      {loading ? (
        <p role="status" className="font-bold"><span className="system-copy">
          Checking your session...
        </span></p>
      ) : error ? (
        <div role="alert" className="space-y-3">
          <p className="font-bold"><span className="system-copy">Unable to verify your session.</span></p>
          <Button onClick={retry}><span className="system-copy">Try again</span></Button>
        </div>
      ) : null}
    </div>
  );
}
