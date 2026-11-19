"use client";

import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AudioLinesIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/providers/auth-provider";
import { getAuthError } from "../auth.api";
import { loginSchema, type LoginFormValues } from "../auth.schema";

export function LoginForm() {
  const { login } = useAuth();
  const mutation = useMutation({ mutationFn: login });
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { username: "", password: "" },
  });

  return (
    <main className="grid min-h-dvh place-items-center p-6">
      <Card className="w-full max-w-sm">
        <CardHeader className="gap-2">
          <div className="mb-2 flex size-12 items-center justify-center rounded-lg border-2 border-border bg-secondary text-secondary-foreground shadow-neo-sm">
            <AudioLinesIcon className="size-7" />
          </div>
          <CardTitle className="text-2xl font-black">Cakra Orkestra</CardTitle>
          <CardDescription>Sign in to your workspace.</CardDescription>
        </CardHeader>
        <CardContent>
          <form
            noValidate
            className="space-y-4"
            onSubmit={handleSubmit((values) => mutation.mutate(values))}
          >
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                autoComplete="username"
                disabled={mutation.isPending}
                aria-invalid={Boolean(errors.username)}
                {...register("username")}
              />
              {errors.username && (
                <p role="alert" className="text-sm text-destructive">
                  {errors.username.message}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                disabled={mutation.isPending}
                aria-invalid={Boolean(errors.password)}
                {...register("password")}
              />
              {errors.password && (
                <p role="alert" className="text-sm text-destructive">
                  {errors.password.message}
                </p>
              )}
            </div>
            {mutation.isError && (
              <p role="alert" className="text-sm text-destructive">
                {getAuthError(mutation.error)}
              </p>
            )}
            <Button type="submit" size="lg" className="w-full" disabled={mutation.isPending}>
              {mutation.isPending ? "Signing in..." : "Sign in"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}
