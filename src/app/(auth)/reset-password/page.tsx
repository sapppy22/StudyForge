import type { Metadata } from "next";
import Link from "next/link";
import { getSessionUser, isGuestUser } from "@/lib/session";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ResetPasswordForm } from "./reset-password-form";

export const metadata: Metadata = { title: "Reset password" };

export default async function ResetPasswordPage() {
  // The recovery link routes through /api/auth/callback, which exchanges the
  // code for a session before landing here. No session means the link was
  // already used, expired, or opened directly.
  // A guest cookie is not a recovery session — only a real Supabase session,
  // created by the callback exchanging the recovery code, can set a password.
  const user = await getSessionUser();

  if (!user || isGuestUser(user)) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Link expired</CardTitle>
          <CardDescription>
            Password reset links can only be used once, and expire after a short
            while.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Link href="/login" className={cn(buttonVariants(), "w-full")}>
            Request a new link
          </Link>
        </CardContent>
      </Card>
    );
  }

  return <ResetPasswordForm />;
}
