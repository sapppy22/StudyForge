import * as z from "zod";

/**
 * Validation schemas for the auth forms.
 *
 * These run on the server inside the Server Actions (never trust the client),
 * and the flattened field errors are handed straight back to `useActionState`
 * so the form can render per-field messages.
 */

const email = z.email({ error: "Enter a valid email address." }).trim().toLowerCase();

const password = z
  .string()
  .min(8, { error: "Use at least 8 characters." })
  .max(72, { error: "Passwords are limited to 72 characters." })
  .regex(/[a-zA-Z]/, { error: "Include at least one letter." })
  .regex(/[0-9]/, { error: "Include at least one number." });

export const SignInSchema = z.object({
  email,
  // Sign-in must not re-apply the strength rules: an existing account may
  // predate them, and echoing the policy back on login leaks nothing useful.
  password: z.string().min(1, { error: "Enter your password." }),
});

export const SignUpSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, { error: "Name must be at least 2 characters." })
    .max(80, { error: "Name is too long." }),
  email,
  password,
});

export const ResetRequestSchema = z.object({ email });

export const NewPasswordSchema = z
  .object({ password, confirmPassword: z.string() })
  .refine((v) => v.password === v.confirmPassword, {
    error: "Passwords do not match.",
    path: ["confirmPassword"],
  });

/** Shape returned by every auth Server Action, consumed by `useActionState`. */
export type AuthFormState =
  | {
      errors?: Record<string, string[] | undefined>;
      /** Non-field message: either an error banner or a success notice. */
      message?: string;
      status?: "error" | "success";
    }
  | undefined;
