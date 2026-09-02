"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Sparkles } from "lucide-react";
import { api } from "@/lib/api";
import { LABELS } from "@/lib/labels";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface FindIssuesButtonProps {
  className?: string;
}

export function FindIssuesButton({ className }: FindIssuesButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);

  const run = async () => {
    setLoading(true);
    setMessage("");
    try {
      const result = await api.findRecurringIssues();
      const errorMessage = result.errors?.length
        ? result.errors[result.errors.length - 1].replace(/^(detect_patterns|synthesize):\s*/i, "")
        : "";
      setMessage(errorMessage || result.message);
      setIsSuccess(result.surfaced_count > 0 && !result.errors?.length);
      router.refresh();
    } catch (e) {
      setMessage((e as Error).message);
      setIsSuccess(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={cn("flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-2", className)}>
      {message && (
        <span
          className={cn(
            "max-w-xs text-center text-sm sm:text-left",
            isSuccess ? "text-emerald-700" : "text-amber-700"
          )}
        >
          {message}
        </span>
      )}
      <Button
        className="h-11 w-full gap-2 rounded-2xl px-5 shadow-md shadow-primary/20 sm:w-auto"
        disabled={loading}
        onClick={run}
      >
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
        {LABELS.findRecurringIssues}
      </Button>
    </div>
  );
}
