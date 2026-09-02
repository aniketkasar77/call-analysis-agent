"use client";

import { useState } from "react";
import { Download, Loader2 } from "lucide-react";
import { api } from "@/lib/api";
import { LABELS } from "@/lib/labels";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface DownloadSampleRecordingsButtonProps {
  className?: string;
}

export function DownloadSampleRecordingsButton({ className }: DownloadSampleRecordingsButtonProps) {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const onDownload = async () => {
    setLoading(true);
    setMessage("");
    try {
      await api.downloadSampleRecordings();
      setMessage("Sample recordings downloaded");
    } catch (e) {
      setMessage((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={cn("flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-2", className)}>
      {message && <span className="text-center text-sm text-muted-foreground sm:text-left">{message}</span>}
      <Button
        variant="outline"
        className="h-11 w-full gap-2 rounded-2xl border-0 bg-white px-5 shadow-sm hover:bg-white/90 sm:w-auto"
        disabled={loading}
        onClick={onDownload}
      >
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
        {LABELS.downloadSampleRecordings}
      </Button>
    </div>
  );
}
