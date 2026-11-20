"use client";

import { useRef } from "react";
import { Dialog } from "@base-ui/react/dialog";
import { XIcon, UserRoundPenIcon, CameraIcon } from "lucide-react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { DatePicker } from "@/components/shared/date-picker";
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
  useSheetLifecycle,
  Sheet,
  SheetContent, SheetFooter,
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
  modal = false,
}: {
  userId?: string;
  roles: UserRole[];
  onClose: () => void;
  onSaved: () => void;
  modal?: boolean;
}) {
  const detail = useUser(userId ?? "");
  const createMutation = useCreateUser();
  const updateMutation = useUpdateUser();
  const isEditing = Boolean(userId);
  const mutation = isEditing ? updateMutation : createMutation;
  const lifecycle = useSheetLifecycle(onClose);
  const pending = mutation.isPending;

  function handleOpenChange(open: boolean) {
    if (!open && !pending) lifecycle.close();
  }

  async function handleSave(values: UserFormValues) {
    const fields = {
      username: values.username,
      name: userId ? values.name : values.username,
      avatar_url: userId ? values.avatar_url || null : null,
      birth_date: userId ? values.birth_date || null : null,
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
      lifecycle.closeThen(() => { onSaved(); onClose(); });
    } catch {
      // The form displays the API error, preserving the user's input.
    }
  }

  const content = (
    <>
      <SheetHeader>
        {modal ? <Dialog.Title className="flex items-center gap-2 text-lg font-bold"><UserRoundPenIcon className="size-6" /> Edit information</Dialog.Title> : <SheetTitle>{isEditing ? "Edit user" : "Add user"}</SheetTitle>}
        {modal ? <Dialog.Description className="text-sm text-muted-foreground">Update your personal information.</Dialog.Description> : <SheetDescription>{isEditing ? "Update employee information." : "Create a new employee account."}</SheetDescription>}
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
            modal={modal}
            user={detail.data}
            roles={roles}
            pending={pending}
            error={mutation.error}
            onSave={handleSave}
            onClose={lifecycle.close}
          />
        )}
    </>
  );
  if (modal) return (
    <Dialog.Root open={lifecycle.open} onOpenChange={handleOpenChange} onOpenChangeComplete={lifecycle.onOpenChangeComplete}>
      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm" />
        <Dialog.Popup className="fixed left-1/2 top-1/2 z-50 flex max-h-[90dvh] w-[calc(100%-2rem)] max-w-2xl -translate-x-1/2 -translate-y-1/2 flex-col border-2 border-border bg-background shadow-neo-card outline-none">
          <Dialog.Close disabled={pending} className="absolute right-4 top-4 p-1" aria-label="Close"><XIcon className="size-5" /></Dialog.Close>
          {content}
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
  return (
    <Sheet open={lifecycle.open} onOpenChangeComplete={lifecycle.onOpenChangeComplete} onOpenChange={handleOpenChange}>
      <SheetContent className="w-full border-l-2 border-border sm:max-w-md">{content}</SheetContent>
    </Sheet>
  );
}

function UserForm({
  modal = false,
  user,
  roles,
  pending,
  error,
  onSave,
  onClose,
}: {
  modal?: boolean;
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
    watch,
    setValue,
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

  const avatarInput = useRef<HTMLInputElement>(null);

  async function selectAvatar(file?: File) {
    if (!file) return;
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type) || file.size > 5 * 1024 * 1024) {
      toast.error("Choose a JPG, PNG or WebP image under 5 MB.");
      return;
    }
    try {
      const bitmap = await createImageBitmap(file);
      const canvas = document.createElement("canvas");
      canvas.width = canvas.height = 256;
      const size = Math.min(bitmap.width, bitmap.height);
      canvas.getContext("2d")!.drawImage(bitmap, (bitmap.width-size)/2, (bitmap.height-size)/2, size, size, 0, 0, 256, 256);
      bitmap.close();
      setValue("avatar_url", canvas.toDataURL("image/webp", 0.8), { shouldDirty: true, shouldValidate: true });
    } catch {
      toast.error("Unable to read image.");
    }
  }

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
      <div className={modal ? "grid flex-1 grid-cols-1 gap-4 overflow-y-auto p-5 sm:grid-cols-[112px_minmax(0,1fr)]" : "flex-1 space-y-4 overflow-y-auto p-4"}>
        {modal && (
          <div className="flex flex-col items-center justify-center gap-2 sm:row-span-2">
            <button type="button" aria-label="Upload profile photo" disabled={pending} onClick={() => avatarInput.current?.click()} className="group relative cursor-pointer disabled:cursor-not-allowed focus-visible:outline-2 focus-visible:outline-offset-4">
              <Avatar className="size-24 rounded-none border-2 border-border bg-primary">
                {watch("avatar_url") && <AvatarImage src={watch("avatar_url")} alt="Profile preview" />}
                <AvatarFallback className="rounded-none bg-yellow text-2xl font-bold text-black">{watch("name").split(/\s+/).map(part => part[0]).join("").slice(0, 2).toUpperCase()}</AvatarFallback>
              </Avatar>
              <span className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100"><CameraIcon className="size-6 text-white" /></span>
              <span className="absolute -bottom-1 -right-1 border-2 border-border bg-background p-1.5 shadow-neo-card"><CameraIcon className="size-4" /></span>
            </button>
            <input ref={avatarInput} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={event => { void selectAvatar(event.target.files?.[0]); event.target.value = ""; }} />
            <span className="text-xs text-muted-foreground"><span className="system-copy">Profile photo</span></span>
            {watch("avatar_url") && <button type="button" disabled={pending} className="text-xs underline" onClick={() => setValue("avatar_url", "", { shouldDirty: true })}>Remove</button>}
          </div>
        )}
        {fields.filter(field => (!modal || field.name !== "avatar_url") && (isEditing || field.name === "username" || field.name === "password" || field.name === "confirm_password")).map((field) => (
          <div key={field.name} className={modal && (field.name === "avatar_url" || field.name === "birth_date") ? "space-y-2 sm:col-span-2" : "space-y-2"}>
            <Label htmlFor={`user-${field.name}`}>{field.label}</Label>
            {field.name === "birth_date" ? (
              <Controller name="birth_date" control={control} render={({ field: birth }) => (
                <DatePicker id="user-birth_date" ariaLabel="Birth date" value={birth.value} onChange={birth.onChange} disabled={pending} invalid={Boolean(errors.birth_date)} yearNavigation />
              )} />
            ) : <Input
              id={`user-${field.name}`}
              type={field.type}
              autoComplete={field.autoComplete}
              required={field.required}
              disabled={pending}
              aria-invalid={Boolean(errors[field.name])}
              {...register(field.name)}
            />}
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
      <SheetFooter>
        <Button type="button" variant="outline" disabled={pending} onClick={onClose}><span className="system-copy">
          Cancel
        </span></Button>
        <Button type="submit" disabled={pending || (!isEditing && roles.length === 0)}>
          {pending ? "Saving..." : isEditing ? "Save changes" : "Create user"}
        </Button>
      </SheetFooter>
    </form>
  );
}
