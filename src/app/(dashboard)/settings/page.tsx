import Link from "next/link";
import { isGuestUser, requireUser } from "@/lib/session";
import { isAiConfigured } from "@/lib/env";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button, buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/shared/page-header";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { signOut } from "@/services/auth/auth";
import { Sparkles, CheckCircle2, MinusCircle, Mail, UserRound, ShieldCheck } from "lucide-react";
import { EmailDigestSettings } from "@/components/settings/email-digest-settings";
import { cn } from "@/lib/utils";

export default async function SettingsPage() {
  const user = await requireUser();
  const aiOn = isAiConfigured();
  const guest = isGuestUser(user);
  const name = (user.user_metadata?.name as string) ?? "Student";

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <PageHeader title="Settings" description="Manage your account and preferences." />

      {guest && (
        <Card className="border-primary/40 bg-primary/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShieldCheck className="size-4.5 text-primary" /> Save your progress
            </CardTitle>
            <CardDescription>
              You&apos;re using StudyForge as a guest. Your goals, notes, tests and
              flashcards live in this browser&apos;s session — create an account and
              they all carry over, so you can study from any device.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/login" className={cn(buttonVariants())}>
              Create an account
            </Link>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Account</CardTitle>
          <CardDescription>
            {guest ? "You're browsing without an account." : "Your StudyForge sign-in."}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="flex size-10 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold uppercase text-primary">
              {guest ? <UserRound className="size-5" /> : (user.email ?? "?").slice(0, 2)}
            </span>
            <div>
              <p className="flex items-center gap-2 text-sm font-medium">
                {guest ? "Guest" : name}
                {guest && (
                  <Badge variant="secondary" className="font-normal">
                    Guest mode
                  </Badge>
                )}
              </p>
              <p className="text-sm text-muted-foreground">
                {guest ? "No email on file" : user.email}
              </p>
            </div>
          </div>
          <form action={signOut}>
            <Button variant="outline" type="submit">
              {guest ? "Exit guest session" : "Sign out"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Appearance</CardTitle>
          <CardDescription>Switch between light, dark and system themes.</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Theme</span>
          <ThemeToggle />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="size-4.5 text-primary" /> Performance Email Reports
          </CardTitle>
          <CardDescription>
            Automated performance scorecards, periodic quiz summaries, and syllabus coverage milestones.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {guest ? (
            <p className="text-sm text-muted-foreground">
              Email reports need an address to send to.{" "}
              <Link href="/login" className="underline underline-offset-4">
                Create an account
              </Link>{" "}
              to turn them on.
            </p>
          ) : (
            <EmailDigestSettings userEmail={user.email ?? "student@studyforge.app"} />
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="size-4.5 text-primary" /> AI features
          </CardTitle>
          <CardDescription>
            Question generation, grading, flashcards and the tutor use Groq when
            configured.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">
            Groq API key
          </span>
          {aiOn ? (
            <Badge className="gap-1 bg-emerald-500/15 text-emerald-700 dark:text-emerald-400">
              <CheckCircle2 className="size-3.5" /> Connected
            </Badge>
          ) : (
            <Badge variant="secondary" className="gap-1">
              <MinusCircle className="size-3.5" /> Offline mode
            </Badge>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
