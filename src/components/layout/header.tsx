"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import { useRouter } from "next/navigation";
import { Search, Menu, Bell } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Sidebar } from "./sidebar";

const quickActions = [
  { label: "Generate test", value: "/dashboard", icon: "T" },
  { label: "Review flashcards", value: "/flashcards", icon: "F" },
  { label: "Ask chatbot", value: "/chat", icon: "C" },
  { label: "Create goal", value: "/goals/new", icon: "G" },
];

export function Header() {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  return (
    <header className="sticky top-0 z-10 flex h-14 items-center justify-between border-b border-[#E9E9E7] bg-white px-4 md:px-6">
      <div className="flex items-center gap-3 md:hidden">
        <Sheet>
          <SheetTrigger className="inline-flex h-9 w-9 items-center justify-center rounded-md text-sm font-medium transition-colors hover:bg-muted md:hidden">
            <Menu className="h-5 w-5" />
          </SheetTrigger>
          <SheetContent side="left" className="p-0">
            <Sidebar />
          </SheetContent>
        </Sheet>
        <span className="font-semibold">StudyForge</span>
      </div>

      <Button
        variant="outline"
        className="hidden h-9 w-72 justify-start gap-2 rounded-md text-sm text-muted-foreground md:flex"
        onClick={() => setOpen(true)}
      >
        <Search className="h-4 w-4" />
        <span>Search or jump to...</span>
        <kbd className="ml-auto rounded border bg-muted px-1.5 text-xs">⌘K</kbd>
      </Button>

      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-red-500" />
        </Button>
      </div>

      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput placeholder="Type a command or search..." />
        <CommandList>
          <CommandEmpty>No results found.</CommandEmpty>
          <CommandGroup heading="Quick actions">
            {quickActions.map((action) => (
              <CommandItem
                key={action.value}
                onSelect={() => {
                  router.push(action.value);
                  setOpen(false);
                }}
              >
                <span className="mr-2 flex h-4 w-4 items-center justify-center rounded-sm bg-[#F7F7F5] text-xs">
                  {action.icon}
                </span>
                {action.label}
              </CommandItem>
            ))}
          </CommandGroup>
          <CommandSeparator />
          <CommandGroup heading="Navigation">
            <CommandItem onSelect={() => { router.push("/dashboard"); setOpen(false); }}>
              Dashboard
            </CommandItem>
            <CommandItem onSelect={() => { router.push("/flashcards"); setOpen(false); }}>
              Flashcards
            </CommandItem>
            <CommandItem onSelect={() => { router.push("/analytics"); setOpen(false); }}>
              Analytics
            </CommandItem>
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </header>
  );
}
