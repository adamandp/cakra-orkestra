"use client";

import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog } from "@base-ui/react/dialog";
import { EyeIcon, EyeOffIcon, LockKeyholeIcon, XIcon } from "lucide-react";
import { useState } from "react";
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
  const [visible, setVisible] = useState<Partial<Record<keyof ChangePasswordFormValues, boolean>>>({});
  const {
    watch,
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
      setVisible({});
      reset();
      onOpenChange(false);
    },
  });

  function handleOpenChange(value: boolean) {
    if (mutation.isPending) return;
    if (!value) {
      setVisible({});
      reset();
      mutation.reset();
    }
    onOpenChange(value);
  }

  return (
    <Dialog.Root open={open} onOpenChange={handleOpenChange}>
      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm" />
        <Dialog.Popup className="fixed left-1/2 top-1/2 z-50 flex max-h-[90dvh] w-[calc(100%-2rem)] max-w-lg -translate-x-1/2 -translate-y-1/2 flex-col border-2 border-border bg-background shadow-neo-card outline-none">
          <div className="flex items-center gap-3 border-b-2 border-border bg-yellow p-4 text-black">
            <div className="border-2 border-black bg-white p-2"><LockKeyholeIcon className="size-6" /></div>
            <div className="flex-1 pr-6">
              <Dialog.Title className="text-lg font-bold">Change password</Dialog.Title>
              <Dialog.Description className="text-sm">Update your account password.</Dialog.Description>
            </div>
            <Dialog.Close disabled={mutation.isPending} aria-label="Close" className="absolute right-4 top-4 p-1"><XIcon className="size-5" /></Dialog.Close>
          </div>
        <form
          noValidate
          className="flex min-h-0 flex-1 flex-col"
          onSubmit={handleSubmit(({ current_password, new_password }) =>
            mutation.mutate({ current_password, new_password }),
          )}
        >
          <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-4">
          {fields.map((field) => (
            <div className="space-y-2" key={field.name}>
              <Label htmlFor={field.name}>{field.label}</Label>
              <div className="relative">
              <Input
                id={field.name}
                type={visible[field.name] ? "text" : "password"}
                className="pr-10"
                autoComplete={field.autoComplete}
                disabled={mutation.isPending}
                aria-invalid={Boolean(errors[field.name])}
                {...register(field.name)}
              />
              <button type="button" disabled={mutation.isPending} aria-label={visible[field.name] ? "Hide password" : "Show password"} onClick={() => setVisible(prev => ({ ...prev, [field.name]: !prev[field.name] }))} className="absolute right-2 top-1/2 -translate-y-1/2 p-1">
                {visible[field.name] ? <EyeOffIcon className="size-4" /> : <EyeIcon className="size-4" />}
              </button>
              </div>
              {field.name === "new_password" && <p className="text-xs text-muted-foreground">{watch("new_password").length >= 8 ? "✓ At least 8 characters" : "Use at least 8 characters."}</p>}
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
          </div>
          <div className="flex shrink-0 justify-end gap-3 border-t-2 border-border p-4">
          <Button type="button" variant="outline" disabled={mutation.isPending} onClick={() => handleOpenChange(false)}>Cancel</Button>
          <Button type="submit" disabled={mutation.isPending}>
            {mutation.isPending ? "Saving..." : "Update password"}
          </Button>
          </div>
        </form>
      </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
