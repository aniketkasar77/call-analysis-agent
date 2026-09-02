"use client";

import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { AddRecordingsButton } from "@/components/actions/add-recordings-button";
import { DownloadSampleRecordingsButton } from "@/components/actions/download-sample-recordings-button";
import { FindIssuesButton } from "@/components/actions/find-issues-button";

interface TopHeaderProps {
  search?: string;
  onSearchChange?: (value: string) => void;
  showActions?: boolean;
}

export function TopHeader({ search = "", onSearchChange, showActions = true }: TopHeaderProps) {
  return (
    <header className="flex flex-col gap-4">
      <div className="relative w-full sm:max-w-md">
        <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search..."
          value={search}
          onChange={(e) => onSearchChange?.(e.target.value)}
          className="h-11 w-full rounded-2xl border-0 bg-white pl-11 shadow-sm"
        />
      </div>
      {showActions && (
        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
          <AddRecordingsButton className="w-full sm:w-auto" />
          <DownloadSampleRecordingsButton className="w-full sm:w-auto" />
          <FindIssuesButton className="w-full sm:w-auto" />
        </div>
      )}
    </header>
  );
}
