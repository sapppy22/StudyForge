import Link from "next/link";
import { redirect } from "next/navigation";
import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { getSessionUser } from "@/services/auth/auth";
import { getGoalsByUser } from "@/services/goals/goalService";
import { BrainCircuit, Calendar, Layers, Target, TrendingDown } from "lucide-react";

function daysTo(date: Date | null) {
  if (!date) return null;
  const diff = new Date(date).getTime() - Date.now();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

function averageProficiency(topics: any[]) {
  if (!topics.length) return 0;
  const scores = topics.flatMap((t) => t.proficiencyScores?.map((p: any) => p.score) ?? []);
  if (!scores.length) return 0;
  return Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
}

export default async function DashboardPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  const goals = await getGoalsByUser(user.id);
  const activeGoal = goals[0];

  if (!activeGoal) {
    return (
      <div className="flex h-[calc(100vh-8rem)] flex-col items-center justify-center text-center">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#F7F7F5]">
          <BrainCircuit className="h-8 w-8" />
        </div>
        <h1 className="text-2xl font-semibold">No goals yet</h1>
        <p className="mt-2 max-w-sm text-muted-foreground">
          Create your first exam goal to generate a syllabus tree and start tracking proficiency.
        </p>
        <Link className={buttonVariants({ className: "mt-6" })} href="/goals/new">
          Create goal
        </Link>
      </div>
    );
  }

  const progress = averageProficiency(activeGoal.topics);
  const days = daysTo(activeGoal.examDate);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">{activeGoal.title}</h1>
          <p className="text-sm text-muted-foreground">Overall preparation progress</p>
        </div>
        <Link className={buttonVariants({ variant: "outline" })} href="/goals/new">
          Switch goal
        </Link>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="border-none shadow-sm">
          <CardHeader className="pb-2">
            <CardDescription>Overall progress</CardDescription>
            <CardTitle className="text-3xl">{progress}%</CardTitle>
          </CardHeader>
          <CardContent>
            <Progress value={progress} className="h-2" />
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm">
          <CardHeader className="pb-2">
            <CardDescription>Days to exam</CardDescription>
            <CardTitle className="text-3xl">{days ?? "—"}</CardTitle>
          </CardHeader>
          <CardContent>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm">
          <CardHeader className="pb-2">
            <CardDescription>Due today</CardDescription>
            <CardTitle className="text-3xl">0</CardTitle>
          </CardHeader>
          <CardContent>
            <Layers className="h-4 w-4 text-muted-foreground" />
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm">
          <CardHeader className="pb-2">
            <CardDescription>Weakest topic</CardDescription>
            <CardTitle className="text-base font-medium">Thermodynamics</CardTitle>
          </CardHeader>
          <CardContent>
            <TrendingDown className="h-4 w-4 text-red-500" />
          </CardContent>
        </Card>
      </div>

      <Card className="border-none shadow-sm">
        <CardHeader>
          <CardTitle>Syllabus</CardTitle>
          <CardDescription>Your topic tree, pre-loaded at 0% proficiency.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {activeGoal.topics.map((subject) => (
              <div key={subject.id}>
                <div className="flex items-center justify-between">
                  <h3 className="font-medium">{subject.title}</h3>
                  <span className="text-xs text-muted-foreground">
                    {subject.children.length} chapters
                  </span>
                </div>
                <div className="mt-2 space-y-2 pl-4">
                  {subject.children.map((chapter: any) => (
                    <div key={chapter.id}>
                      <p className="text-sm text-muted-foreground">{chapter.title}</p>
                      <div className="mt-1 flex flex-wrap gap-2 pl-4">
                        {chapter.children.map((topic: any) => (
                          <Link
                            key={topic.id}
                            href={`/topics/${topic.id}`}
                            className="inline-flex items-center gap-1.5 rounded-md border bg-white px-2.5 py-1 text-xs hover:bg-[#F7F7F5]"
                          >
                            <Target className="h-3 w-3" />
                            {topic.title}
                          </Link>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
