"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { FieldError, FormMessage } from "@/components/auth/form-message";
import { updatePassword } from "@/services/auth/auth";
import { Loader2 } from "lucide-react";

export function ResetPasswordForm() {
  const [state, action, pending] = useActionState(updatePassword, undefined);
  const errors = state?.errors ?? {};

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">Choose a new password</CardTitle>
        <CardDescription>
          You&apos;re signed in from the reset link. Pick a new password to finish.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form action={action} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="password">New password</Label>
            <Input
              id="password"
              name="password"
              type="password"
              autoComplete="new-password"
              aria-invalid={Boolean(errors.password)}
              required
            />
            <FieldError errors={errors.password} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm new password</Label>
            <Input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              autoComplete="new-password"
              aria-invalid={Boolean(errors.confirmPassword)}
              required
            />
            <FieldError errors={errors.confirmPassword} />
          </div>

          <FormMessage state={state} />

          <Button type="submit" className="w-full" disabled={pending}>
            {pending && <Loader2 className="size-4 animate-spin" />}
            Update password
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
