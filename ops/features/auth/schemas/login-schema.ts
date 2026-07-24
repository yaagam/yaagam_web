import { z } from "zod";

export const loginSchema = z.object({
  username: z.string().min(2, "Username is required."),
  password: z.string().min(8, "Password must be at least 8 characters."),
  totp: z.string().regex(/^\d{6}$/, "Enter the 6 digit TOTP code."),
  rememberDevice: z.boolean()
});

export type LoginFormValues = z.infer<typeof loginSchema>;