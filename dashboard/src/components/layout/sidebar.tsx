"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart3, Phone, Upload, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

const links = [
  { href: "/", label: "Insights", icon: BarChart3 },
  { href: "/calls", label: "Calls", icon: Phone },
  { href: "/upload", label: "Upload", icon: Upload },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex h-full w-64 flex-col border-r bg-card/80 backdrop-blur-sm">
      <div className="flex items-center gap-3 border-b px-6 py-5">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm">
          <Sparkles className="h-5 w-5" />
        </div>
        <div>
          <p className="font-semibold leading-tight">Call Analyse</p>
          <p className="text-xs text-muted-foreground">Agent Dashboard</p>
        </div>
      </div>
      <nav className="flex flex-1 flex-col gap-1 p-4">
        {links.map(({ href, label, icon: Icon }) => {
          const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                active
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              )}
            >
              <Icon className="h-4 w-4" />
              {label}
            </Link>
          );
        })}
      </nav>
      <div className="border-t p-4">
        <p className="text-xs text-muted-foreground leading-relaxed">
          Multi-agent pipeline powered by LangGraph, Gemini & Whisper.
        </p>
      </div>
    </aside>
  );
}
