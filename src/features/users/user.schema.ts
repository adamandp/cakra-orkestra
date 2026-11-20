import { z } from "zod";

const username = z.string().trim().min(1, "Username is required").max(100);
const name = z.string().trim().min(1, "Name is required").max(150);
const password = z.string().min(8, "Use at least 8 characters").max(100);
const roleId = z.uuid("Select a role");
const avatarUrl = z
  .string()
  .trim()
  .url("Enter a valid URL")
  .refine((value) => /^https?:\/\//i.test(value) || (value.length <= 350000 && /^data:image\/(webp|png);base64,[A-Za-z0-9+/]+={0,2}$/.test(value)), "Use an HTTP or HTTPS URL or uploaded image");
const birthDate = z.iso.date("Enter a valid date");

const userFieldsSchema = z.object({
  username,
  name,
  avatar_url: avatarUrl.nullable(),
  birth_date: birthDate.nullable(),
});

export const createUserSchema = userFieldsSchema.extend({
  password,
  role_id: roleId,
});

export const updateUserSchema = userFieldsSchema
  .partial()
  .strict()
  .refine((value) => Object.keys(value).length > 0, "Provide at least one field to update");

export const updateUserStatusSchema = z.object({ is_active: z.boolean() }).strict();
export const updateUserRoleSchema = z.object({ role_id: roleId }).strict();

export const userListSchema = z.object({
  q: z.string().trim().max(255).optional(),
  role_id: roleId.optional(),
  is_active: z.enum(["true", "false"]).optional(),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  offset: z.coerce.number().int().min(0).default(0),
});

export function getUserFormSchema(mode: "create" | "edit") {
  return z
    .object({
      username,
      name: mode === "create" ? z.string() : name,
      avatar_url: z.union([z.literal(""), avatarUrl]),
      birth_date: z.union([z.literal(""), birthDate]),
      password: mode === "create" ? password : z.string(),
      confirm_password: z.string(),
      role_id: mode === "create" ? roleId : z.string(),
    })
    .refine((value) => mode === "edit" || value.password === value.confirm_password, {
      path: ["confirm_password"],
      message: "Passwords do not match",
    });
}

export type UserFormValues = z.infer<ReturnType<typeof getUserFormSchema>>;
