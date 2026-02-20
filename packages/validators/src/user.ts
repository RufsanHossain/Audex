// ─── @audex/validators — User Schemas ───────────────────────────────────────

import { z } from "zod";

import { emailSchema, objectIdSchema, safeStringSchema } from "./common.js";
import { deviceTypeSchema } from "./enums.js";

// ── Signup ──────────────────────────────────────────────────────────────────

export const signupSchema = z
  .object({
    name: safeStringSchema(2, 100),
    email: emailSchema,
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .max(128, "Password must be at most 128 characters")
      .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
      .regex(/[a-z]/, "Password must contain at least one lowercase letter")
      .regex(/\d/, "Password must contain at least one number")
      .regex(/[^A-Za-z\d]/, "Password must contain at least one special character"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

// ── Login ───────────────────────────────────────────────────────────────────

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Password is required"),
});

// ── Forgot / Reset Password ─────────────────────────────────────────────────

export const forgotPasswordSchema = z.object({
  email: emailSchema,
});

export const resetPasswordSchema = z
  .object({
    token: z.string().min(1, "Token is required"),
    password: z
      .string()
      .min(8)
      .max(128)
      .regex(/[A-Z]/)
      .regex(/[a-z]/)
      .regex(/\d/)
      .regex(/[^A-Za-z\d]/),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

// ── Update Profile ──────────────────────────────────────────────────────────

export const updateProfileSchema = z.object({
  name: safeStringSchema(2, 100).optional(),
  image: z.string().url().max(2048).optional(),
});

// ── Update Settings ─────────────────────────────────────────────────────────

export const updateSettingsSchema = z.object({
  defaultDevice: deviceTypeSchema.optional(),
  notifications: z
    .object({
      auditComplete: z.boolean().optional(),
      scoreRegression: z.boolean().optional(),
      weeklyDigest: z.boolean().optional(),
      marketingEmails: z.boolean().optional(),
    })
    .optional(),
});

// ── Change Password ─────────────────────────────────────────────────────────

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: z
      .string()
      .min(8)
      .max(128)
      .regex(/[A-Z]/)
      .regex(/[a-z]/)
      .regex(/\d/)
      .regex(/[^A-Za-z\d]/),
    confirmNewPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmNewPassword, {
    message: "Passwords do not match",
    path: ["confirmNewPassword"],
  });

// ── Admin: List Users ───────────────────────────────────────────────────────

export const adminListUsersSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  role: z.enum(["free", "pro", "team", "enterprise", "admin"]).optional(),
  search: z.string().max(200).optional(),
  sort: z.enum(["createdAt", "name", "email", "auditCount"]).default("createdAt"),
  order: z.enum(["asc", "desc"]).default("desc"),
});

// ── Admin: Update User Role ─────────────────────────────────────────────────

export const adminUpdateUserRoleSchema = z.object({
  id: objectIdSchema,
  role: z.enum(["free", "pro", "team", "enterprise", "admin"]),
});

// ── Type Exports ────────────────────────────────────────────────────────────

export type SignupInput = z.infer<typeof signupSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type UpdateSettingsInput = z.infer<typeof updateSettingsSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
export type AdminListUsersInput = z.infer<typeof adminListUsersSchema>;
export type AdminUpdateUserRoleInput = z.infer<typeof adminUpdateUserRoleSchema>;
