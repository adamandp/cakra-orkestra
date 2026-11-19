"use client";

import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { changePassword, getAuthError } from "../auth.api";
import { changePasswordSchema, type ChangePasswordFormValues } from "../auth.schema";

const fields = [
  { name: "current_password", label: "Current password", autoComplete: "current-password" },
  { name: "new_password", label: "New password", autoComplete: "new-password" },
  { name: "confirm_password", label: "Confirm new password", autoComplete: "new-password" },
] as const;

export function ChangePasswordSheet({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ChangePasswordFormValues>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: { current_password: "", new_password: "", confirm_password: "" },
  });
  const mutation = useMutation({
    mutationFn: changePassword,
    onSuccess: () => {
      toast.success("Password updated");
      reset();
      onOpenChange(false);
    },
  });

  function handleOpenChange(value: boolean) {
    if (mutation.isPending) return;
    if (!value) {
      reset();
      mutation.reset();
    }
    onOpenChange(value);
  }

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent className="border-l-2 border-border">
        <SheetHeader>
          <SheetTitle>Change password</SheetTitle>
          <SheetDescription>Update your account password.</SheetDescription>
        </SheetHeader>
        <form
          noValidate
          className="space-y-4 overflow-y-auto p-4"
          onSubmit={handleSubmit(({ current_password, new_password }) =>
            mutation.mutate({ current_password, new_password }),
          )}
        >
          {fields.map((field) => (
            <div className="space-y-2" key={field.name}>
              <Label htmlFor={field.name}>{field.label}</Label>
              <Input
                id={field.name}
                type="password"
                autoComplete={field.autoComplete}
                disabled={mutation.isPending}
                aria-invalid={Boolean(errors[field.name])}
                {...register(field.name)}
              />
              {errors[field.name] && (
                <p role="alert" className="text-sm text-destructive">
                  {errors[field.name]?.message}
                </p>
              )}
            </div>
          ))}
          {mutation.isError && (
            <p role="alert" className="text-sm text-destructive">
              {getAuthError(mutation.error)}
            </p>
          )}
          <Button type="submit" disabled={mutation.isPending} className="w-full">
            {mutation.isPending ? "Saving..." : "Save password"}
          </Button>
        </form>
      </SheetContent>
    </Sheet>
  );
}
