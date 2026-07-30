import { getSessionUser } from "@/services/auth/auth";
import { getGoalsByUser } from "@/services/goals/goalService";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

export default async function SubjectsPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  const goals = await getGoalsByUser(user.id);
  const active = goals[0];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Subjects</h1>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {active?.topics.map((subject: any) => (
          <Card key={subject.id} className="border-none shadow-sm">
            <CardHeader>
              <CardTitle>{subject.title}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Progress value={0} className="h-2" />
              <div className="space-y-2">
                {subject.children.map((chapter: any) => (
                  <div key={chapter.id} className="text-sm">
                    <p className="font-medium">{chapter.title}</p>
                    <div className="mt-1 flex flex-wrap gap-1">
                      {chapter.children.map((topic: any) => (
                        <Link
                          key={topic.id}
                          href={`/topics/${topic.id}`}
                          className="text-xs text-indigo-600 hover:underline"
                        >
                          {topic.title}
                        </Link>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
        {!active && <p className="text-muted-foreground">Create a goal to see subjects.</p>}
      </div>
    </div>
  );
}
