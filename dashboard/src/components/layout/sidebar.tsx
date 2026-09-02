"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Library, Phone } from "lucide-react";
import { cn } from "@/lib/utils";
import { LABELS } from "@/lib/labels";

const links = [
  { href: "/", label: LABELS.dashboard, shortLabel: "Home", icon: LayoutDashboard },
  { href: "/calls", label: LABELS.yourRecordings, shortLabel: "Calls", icon: Phone },
  { href: "/insights", label: LABELS.recurringIssues, shortLabel: "Issues", icon: Library },
];

function NavLink({
  href,
  label,
  shortLabel,
  icon: Icon,
  active,
  layout,
}: {
  href: string;
  label: string;
  shortLabel: string;
  icon: React.ComponentType<{ className?: string }>;
  active: boolean;
  layout: "sidebar" | "bottom";
}) {
  return (
    <Link
      href={href}
      title={label}
      aria-label={label}
      className={cn(
        "flex items-center justify-center transition-all",
        layout === "sidebar"
          ? "h-11 w-11 rounded-xl"
          : "min-w-0 flex-1 flex-col justify-center gap-0.5 rounded-lg px-1 py-1.5 text-[10px] font-medium sm:text-[11px]",
        active
          ? layout === "sidebar"
            ? "bg-primary text-white shadow-md shadow-primary/25"
            : "text-primary"
          : layout === "sidebar"
            ? "text-muted-foreground hover:bg-white hover:text-foreground hover:shadow-sm"
            : "text-muted-foreground"
      )}
    >
      <Icon className="h-5 w-5 shrink-0" />
      {layout === "bottom" && (
        <span className="w-full truncate text-center leading-tight">{shortLabel}</span>
      )}
    </Link>
  );
}

export function Sidebar() {
  const pathname = usePathname();

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);

  return (
    <>
      {/* Desktop — sticky sidebar (in document flow, no overlap) */}
      <aside className="app-sidebar-desktop sticky top-0 z-30 hidden h-screen w-[72px] shrink-0 flex-col items-center border-r border-white/60 bg-white/90 py-6 backdrop-blur-md md:flex">
        <Link href="/" className="mb-8 flex h-11 w-11 shrink-0 items-center justify-center" title="CallAI">
          <Image
            src="/logo.png"
            alt="CallAI logo"
            width={44}
            height={44}
            className="h-11 w-11 object-contain"
            priority
          />
        </Link>
        <nav className="flex flex-1 flex-col gap-2">
          {links.map((link) => (
            <NavLink key={link.href} {...link} active={isActive(link.href)} layout="sidebar" />
          ))}
        </nav>
      </aside>

      {/* Mobile — fixed bottom navigation */}
      <nav className="app-nav-mobile-bottom fixed inset-x-0 bottom-0 z-40 hidden h-16 items-stretch border-t border-white/60 bg-white/95 px-1 pb-[env(safe-area-inset-bottom)] backdrop-blur-md md:hidden">
        {links.map((link) => (
          <NavLink key={link.href} {...link} active={isActive(link.href)} layout="bottom" />
        ))}
      </nav>
    </>
  );
}
