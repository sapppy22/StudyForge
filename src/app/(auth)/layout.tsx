import Link from "next/link";
import { BrainCircuit } from "lucide-react";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 px-4 py-10">
      <div className="w-full max-w-md">
        <Link
          href="/"
          className="mb-6 flex items-center justify-center gap-2 font-semibold"
        >
          <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <BrainCircuit className="size-5" />
          </span>
          <span className="text-lg tracking-tight">StudyForge</span>
        </Link>
        {children}
      </div>
    </div>
  );
}
