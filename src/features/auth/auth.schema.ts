import { z } from "zod";

export const loginSchema = z.object({
  username: z.string().trim().min(1, "Username is required").max(100),
  password: z.string().min(1, "Password is required").max(100),
});

export const passwordSchema = z.object({
  current_password: z.string().min(1, "Current password is required").max(100),
  new_password: z.string().min(8, "Use at least 8 characters").max(100),
});

export const changePasswordSchema = passwordSchema
  .extend({
    confirm_password: z.string().min(1, "Confirm your new password"),
  })
  .refine((value) => value.new_password !== value.current_password, {
    path: ["new_password"],
    message: "Choose a different password",
  })
  .refine((value) => value.new_password === value.confirm_password, {
    path: ["confirm_password"],
    message: "Passwords do not match",
  });

export type LoginFormValues = z.infer<typeof loginSchema>;
export type ChangePasswordFormValues = z.infer<typeof changePasswordSchema>;
