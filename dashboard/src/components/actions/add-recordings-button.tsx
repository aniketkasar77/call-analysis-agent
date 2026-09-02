"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Plus } from "lucide-react";
import { api } from "@/lib/api";
import { LABELS } from "@/lib/labels";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface AddRecordingsButtonProps {
  className?: string;
}

export function AddRecordingsButton({ className }: AddRecordingsButtonProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const onFiles = async (files: FileList | null) => {
    if (!files?.length) return;
    setLoading(true);
    setMessage("");
    try {
      const result = await api.uploadCalls(Array.from(files));
      setMessage(LABELS.recordingsAdded(result.count));
      router.refresh();
    } catch (e) {
      setMessage((e as Error).message);
    } finally {
      setLoading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  return (
    <div className={cn("flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-2", className)}>
      {message && <span className="text-center text-sm text-muted-foreground sm:text-left">{message}</span>}
      <Button
        variant="outline"
        className="h-11 w-full gap-2 rounded-2xl border-0 bg-white px-5 shadow-sm hover:bg-white/90 sm:w-auto"
        disabled={loading}
        onClick={() => inputRef.current?.click()}
      >
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
        {LABELS.addRecordings}
      </Button>
      <input
        ref={inputRef}
        type="file"
        accept="audio/*"
        multiple
        className="file-input-hidden hidden"
        onChange={(e) => onFiles(e.target.files)}
      />
    </div>
  );
}
