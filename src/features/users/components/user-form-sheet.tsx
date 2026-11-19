"use client";

import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import type { UserRole } from "@/interface/role.interface";
import type { User } from "@/interface/user.interface";
import { getUserError } from "../user.api";
import { useCreateUser, useUpdateUser } from "../user.mutation";
import { useUser } from "../user.query";
import { getUserFormSchema, type UserFormValues } from "../user.schema";

export function UserFormSheet({
  userId,
  roles,
  onClose,
  onSaved,
}: {
  userId?: string;
  roles: UserRole[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const detail = useUser(userId ?? "");
  const createMutation = useCreateUser();
  const updateMutation = useUpdateUser();
  const isEditing = Boolean(userId);
  const mutation = isEditing ? updateMutation : createMutation;
  const pending = mutation.isPending;

  function handleOpenChange(open: boolean) {
    if (!open && !pending) onClose();
  }

  async function handleSave(values: UserFormValues) {
    const fields = {
      username: values.username,
      name: values.name,
      avatar_url: values.avatar_url || null,
      birth_date: values.birth_date || null,
    };

    try {
      if (userId) {
        await updateMutation.mutateAsync({ id: userId, input: fields });
        toast.success("User updated");
      } else {
        await createMutation.mutateAsync({
          ...fields,
          password: values.password,
          role_id: values.role_id,
        });
        toast.success("User created");
      }
      onSaved();
      onClose();
    } catch {
      // The form displays the API error, preserving the user's input.
    }
  }

  return (
    <Sheet open onOpenChange={handleOpenChange}>
      <SheetContent className="w-full border-l-2 border-border sm:max-w-md">
        <SheetHeader>
          <SheetTitle>{isEditing ? "Edit user" : "Add user"}</SheetTitle>
          <SheetDescription>
            {isEditing ? "Update employee information." : "Create a new employee account."}
          </SheetDescription>
        </SheetHeader>
        {isEditing && detail.isPending ? (
          <div className="space-y-4 p-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        ) : isEditing && detail.isError ? (
          <div className="space-y-4 p-4" role="alert">
            <p className="text-sm text-destructive">{getUserError(detail.error)}</p>
            <Button variant="outline" onClick={() => void detail.refetch()}>
              Retry
            </Button>
          </div>
        ) : (
          <UserForm
            key={userId ?? "create"}
            user={detail.data}
            roles={roles}
            pending={pending}
            error={mutation.error}
            onSave={handleSave}
            onClose={onClose}
          />
        )}
      </SheetContent>
    </Sheet>
  );
}

function UserForm({
  user,
  roles,
  pending,
  error,
  onSave,
  onClose,
}: {
  user?: User;
  roles: UserRole[];
  pending: boolean;
  error: unknown;
  onSave: (values: UserFormValues) => Promise<void>;
  onClose: () => void;
}) {
  const isEditing = Boolean(user);
  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<UserFormValues>({
    resolver: zodResolver(getUserFormSchema(isEditing ? "edit" : "create")),
    defaultValues: {
      name: user?.name ?? "",
      username: user?.username ?? "",
      avatar_url: user?.avatar_url ?? "",
      birth_date: user?.birth_date ?? "",
      role_id: user?.role_id ?? roles.find((role) => role.name === "MEMBER")?.id ?? "",
      password: "",
      confirm_password: "",
    },
  });

  const fields = [
    { name: "name", label: "Full name", type: "text", required: true, autoComplete: "name" },
    { name: "username", label: "Username", type: "text", required: true, autoComplete: "off" },
    {
      name: "avatar_url",
      label: "Avatar URL (optional)",
      type: "url",
      required: false,
      autoComplete: "off",
    },
    {
      name: "birth_date",
      label: "Birth date (optional)",
      type: "date",
      required: false,
      autoComplete: "bday",
    },
    ...(!isEditing
      ? [
          {
            name: "password",
            label: "Password",
            type: "password",
            required: true,
            autoComplete: "new-password",
          } as const,
          {
            name: "confirm_password",
            label: "Confirm password",
            type: "password",
            required: true,
            autoComplete: "new-password",
          } as const,
        ]
      : []),
  ] as const;

  return (
    <form noValidate className="flex min-h-0 flex-1 flex-col" onSubmit={handleSubmit(onSave)}>
      <div className="flex-1 space-y-4 overflow-y-auto p-4">
        {fields.map((field) => (
          <div key={field.name} className="space-y-2">
            <Label htmlFor={`user-${field.name}`}>{field.label}</Label>
            <Input
              id={`user-${field.name}`}
              type={field.type}
              autoComplete={field.autoComplete}
              required={field.required}
              disabled={pending}
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
        {!isEditing && (
          <div className="space-y-2">
            <Label htmlFor="user-role">Role</Label>
            <Controller
              name="role_id"
              control={control}
              render={({ field }) => (
                <Select
                  value={field.value}
                  disabled={pending}
                  onValueChange={(value) => field.onChange(value ?? "")}
                >
                  <SelectTrigger
                    id="user-role"
                    ref={field.ref}
                    onBlur={field.onBlur}
                    aria-invalid={Boolean(errors.role_id)}
                    className="w-full border-2 border-border"
                  >
                    <SelectValue>
                      {roles.find((role) => role.id === field.value)?.name ?? "Select role"}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {roles.map((role) => (
                      <SelectItem key={role.id} value={role.id}>
                        {role.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.role_id && (
              <p role="alert" className="text-sm text-destructive">
                {errors.role_id.message}
              </p>
            )}
          </div>
        )}
        {error != null && (
          <p role="alert" className="text-sm text-destructive">
            {getUserError(error)}
          </p>
        )}
      </div>
      <div className="flex justify-end gap-3 border-t p-4">
        <Button type="button" variant="outline" disabled={pending} onClick={onClose}>
          Cancel
        </Button>
        <Button type="submit" disabled={pending || (!isEditing && roles.length === 0)}>
          {pending ? "Saving..." : isEditing ? "Save changes" : "Create user"}
        </Button>
      </div>
    </form>
  );
}
