import { requireUser } from "@/lib/session";
import { isAiConfigured } from "@/lib/env";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/shared/page-header";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { signOut } from "@/services/auth/auth";
import { Sparkles, CheckCircle2, MinusCircle } from "lucide-react";

export default async function SettingsPage() {
  const user = await requireUser();
  const aiOn = isAiConfigured();

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <PageHeader title="Settings" description="Manage your account and preferences." />

      <Card>
        <CardHeader>
          <CardTitle>Account</CardTitle>
          <CardDescription>Your StudyForge sign-in.</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="flex size-10 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold uppercase text-primary">
              {(user.email ?? "?").slice(0, 2)}
            </span>
            <div>
              <p className="text-sm font-medium">
                {(user.user_metadata?.name as string) ?? "Student"}
              </p>
              <p className="text-sm text-muted-foreground">{user.email}</p>
            </div>
          </div>
          <form action={signOut}>
            <Button variant="outline" type="submit">
              Sign out
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
            <Sparkles className="size-4.5 text-primary" /> AI features
          </CardTitle>
          <CardDescription>
            Question generation, grading, flashcards and the tutor use Claude when
            configured.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">
            Anthropic API key
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
