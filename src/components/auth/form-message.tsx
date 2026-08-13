import { cn } from "@/lib/utils";
import { AlertCircle, CheckCircle2 } from "lucide-react";
import type { AuthFormState } from "@/lib/validation/auth";

/** Per-field validation errors rendered under an input. */
export function FieldError({ errors }: { errors?: string[] }) {
  if (!errors?.length) return null;
  return (
    <ul className="space-y-0.5 text-xs text-destructive">
      {errors.map((e) => (
        <li key={e}>{e}</li>
      ))}
    </ul>
  );
}

/** The form-level banner: an auth failure, or a "check your inbox" notice. */
export function FormMessage({ state }: { state: AuthFormState }) {
  if (!state?.message) return null;
  const success = state.status === "success";
  const Icon = success ? CheckCircle2 : AlertCircle;

  return (
    <p
      role="status"
      className={cn(
        "flex items-start gap-2 rounded-md px-3 py-2 text-sm",
        success
          ? "bg-primary/10 text-primary"
          : "bg-destructive/10 text-destructive"
      )}
    >
      <Icon className="mt-0.5 size-4 shrink-0" />
      <span>{state.message}</span>
    </p>
  );
}
