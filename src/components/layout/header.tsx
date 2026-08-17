"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Search, Menu, LayoutDashboard, Layers, BarChart3, MessageSquare, Target, GraduationCap } from "lucide-react";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Sidebar, type Account } from "./sidebar";
import { Badge } from "@/components/ui/badge";
import { Notifications } from "./notifications";
import { ThemeToggle } from "@/components/ui/theme-toggle";

const quickActions = [
  { label: "Go to Dashboard", value: "/dashboard", icon: LayoutDashboard },
  { label: "Review flashcards", value: "/flashcards", icon: Layers },
  { label: "Browse tests", value: "/tests", icon: GraduationCap },
  { label: "View analytics", value: "/analytics", icon: BarChart3 },
  { label: "Ask the tutor", value: "/chat", icon: MessageSquare },
  { label: "Create a goal", value: "/goals/new", icon: Target },
];

export function Header({ account }: { account?: Account }) {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  function go(href: string) {
    router.push(href);
    setOpen(false);
  }

  return (
    <header className="sticky top-0 z-20 flex h-14 items-center justify-between gap-3 border-b border-border bg-background/80 px-4 backdrop-blur md:px-6">
      <div className="flex items-center gap-2 md:hidden">
        <Sheet>
          <SheetTrigger
            aria-label="Open menu"
            className={cn(buttonVariants({ variant: "ghost", size: "icon" }))}
          >
            <Menu className="size-5" />
          </SheetTrigger>
          <SheetContent side="left" className="w-64 p-0">
            <Sidebar account={account} />
          </SheetContent>
        </Sheet>
        <span className="font-semibold">StudyForge</span>
      </div>

      <button
        onClick={() => setOpen(true)}
        className={cn(
          buttonVariants({ variant: "outline", size: "default" }),
          "hidden h-9 w-72 justify-start gap-2 text-muted-foreground md:flex"
        )}
      >
        <Search className="size-4" />
        <span>Search or jump to…</span>
        <kbd className="ml-auto rounded border bg-muted px-1.5 font-mono text-[10px]">
          ⌘K
        </kbd>
      </button>

      <div className="flex items-center gap-1">
        {account?.isGuest && (
          <Link href="/login" className="mr-1">
            <Badge variant="secondary" className="cursor-pointer gap-1">
              Guest — save progress
            </Badge>
          </Link>
        )}
        <Notifications />
        <ThemeToggle />
      </div>

      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput placeholder="Type a command or search…" />
        <CommandList>
          <CommandEmpty>No results found.</CommandEmpty>
          <CommandGroup heading="Quick actions">
            {quickActions.map((action) => {
              const Icon = action.icon;
              return (
                <CommandItem
                  key={action.value}
                  onSelect={() => go(action.value)}
                >
                  <Icon className="size-4" />
                  {action.label}
                </CommandItem>
              );
            })}
          </CommandGroup>
          <CommandSeparator />
          <CommandGroup heading="Navigation">
            <CommandItem onSelect={() => go("/subjects")}>
              <Target className="size-4" /> Subjects
            </CommandItem>
            <CommandItem onSelect={() => go("/settings")}>
              <LayoutDashboard className="size-4" /> Settings
            </CommandItem>
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </header>
  );
}
