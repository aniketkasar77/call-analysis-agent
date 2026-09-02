"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LABELS } from "@/lib/labels";

function pageTitle(pathname: string): string {
  if (pathname === "/") return LABELS.dashboard;
  if (pathname.startsWith("/calls")) return LABELS.yourRecordings;
  if (pathname.startsWith("/insights")) return LABELS.recurringIssues;
  return "CallAI";
}

export function MobileHeader() {
  const pathname = usePathname();
  const title = pageTitle(pathname);

  return (
    <header className="app-header-mobile sticky top-0 z-30 hidden h-14 shrink-0 items-center gap-3 border-b border-white/60 bg-white/95 px-4 backdrop-blur-md md:hidden">
      <Link href="/" className="flex h-9 w-9 shrink-0 items-center justify-center">
        <Image
          src="/logo.png"
          alt="CallAI logo"
          width={36}
          height={36}
          className="h-9 w-9 object-contain"
          priority
        />
      </Link>
      <div className="min-w-0 flex-1">
        <p className="truncate text-base font-semibold leading-tight">{title}</p>
        <p className="truncate text-xs text-muted-foreground">CallAI</p>
      </div>
    </header>
  );
}
