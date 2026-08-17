"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { signOut } from "@/services/auth/auth";
import {
  LayoutDashboard,
  BookOpen,
  Layers,
  GraduationCap,
  BrainCircuit,
  BarChart3,
  MessageSquare,
  Settings,
  LogOut,
  ListChecks,
  CalendarDays,
  Trophy,
  UserRound,
  ShieldCheck,
} from "lucide-react";

/** The signed-in (or guest) identity rendered in the sidebar footer. */
export type Account = {
  name: string;
  email: string;
  isGuest: boolean;
};

const nav = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/subjects", label: "Subjects", icon: BookOpen },
  { href: "/study-plan", label: "Study plan", icon: CalendarDays },
  { href: "/simulations", label: "Real Simulations", icon: Trophy },
  { href: "/question-bank", label: "Question bank", icon: ListChecks },
  { href: "/flashcards", label: "Flashcards", icon: Layers },
  { href: "/tests", label: "Tests & Quizzes", icon: GraduationCap },
  { href: "/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/chat", label: "Tutor", icon: MessageSquare },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function Sidebar({ account }: { account?: Account }) {
  const pathname = usePathname();

  return (
    <aside className="flex h-full w-64 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground">
      <div className="flex h-14 items-center gap-2 px-4">
        <Link href="/dashboard" className="flex items-center gap-2 font-semibold">
          <span className="flex size-7 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <BrainCircuit className="size-4" />
          </span>
          <span className="tracking-tight">StudyForge</span>
        </Link>
      </div>

      <ScrollArea className="flex-1 px-2 py-2">
        <nav className="flex flex-col gap-0.5">
          {nav.map((item) => {
            const active =
              pathname === item.href || pathname.startsWith(item.href + "/");
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium text-sidebar-foreground/70 transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                  active &&
                    "bg-sidebar-accent text-sidebar-accent-foreground"
                )}
              >
                <Icon className="size-4 shrink-0" />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </ScrollArea>

      <div className="space-y-1 border-t border-sidebar-border p-2">
        {account?.isGuest && (
          <div className="mb-1 rounded-lg bg-sidebar-accent/60 p-3">
            <span className="inline-flex items-center gap-1.5 text-xs font-medium">
              <UserRound className="size-3.5" />
              Guest mode
            </span>
            <p className="mt-1 text-xs text-sidebar-foreground/70">
              Progress lives in this browser only.
            </p>
            <Link
              href="/login"
              className="mt-2 flex items-center gap-1.5 text-xs font-medium text-primary underline underline-offset-4"
            >
              <ShieldCheck className="size-3.5" />
              Save it to an account
            </Link>
          </div>
        )}

        {account && !account.isGuest && (
          <div className="px-3 py-1.5">
            <p className="truncate text-sm font-medium">{account.name}</p>
            <p className="truncate text-xs text-sidebar-foreground/70">
              {account.email}
            </p>
          </div>
        )}

        <button
          onClick={() => signOut()}
          className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium text-sidebar-foreground/70 transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
        >
          <LogOut className="size-4" />
          {account?.isGuest ? "Exit guest session" : "Sign out"}
        </button>
      </div>
    </aside>
  );
}
