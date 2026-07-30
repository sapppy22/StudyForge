"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

export default function TestsPage() {
  const [tests, setTests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/tests")
      .then((r) => r.json())
      .then((data) => {
        setTests(data);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Tests</h1>
      <div className="grid gap-4">
        {tests.map((t) => (
          <Card key={t.id} className="border-none shadow-sm">
            <CardHeader>
              <CardTitle>{t.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">Status: {t.status}</p>
            </CardContent>
          </Card>
        ))}
        {tests.length === 0 && (
          <p className="text-muted-foreground">No tests yet. Generate one from a topic page.</p>
        )}
      </div>
    </div>
  );
}
