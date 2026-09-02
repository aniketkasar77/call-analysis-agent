"use client";

import { useState } from "react";
import { FileText, Headphones, Loader2 } from "lucide-react";
import { CallRecord, callAudioUrl } from "@/lib/api";
import { LABELS, categoryLabel, statusClass, statusLabel } from "@/lib/labels";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface CallCardProps {
  call: CallRecord;
  retrying: boolean;
  onRetry: (callId: string) => void;
}

export function CallCard({ call, retrying, onRetry }: CallCardProps) {
  const [showTranscript, setShowTranscript] = useState(false);
  const [showPlayer, setShowPlayer] = useState(false);

  return (
    <div className="min-w-0 overflow-hidden rounded-2xl bg-white p-4 shadow-sm sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1 space-y-1">
          <p className="truncate font-mono text-xs text-muted-foreground sm:text-sm">{call.call_id}</p>
          <p className="text-sm">
            {call.analysis?.category ? categoryLabel(call.analysis.category) : "Awaiting review"}
          </p>
        </div>
        <Badge className={cn("shrink-0", statusClass(call.status))}>{statusLabel(call.status)}</Badge>
      </div>

      <div className="mt-3 min-w-0 space-y-2">
        {call.analysis ? (
          <>
            <p className="break-words font-medium leading-snug">{call.analysis.primary_reason}</p>
            <p className="break-words text-sm text-muted-foreground">
              {LABELS.likelyRootCause}: {call.analysis.upstream_issue_hypothesis}
            </p>
          </>
        ) : call.pipeline_error?.length ? (
          <>
            <p className="text-sm text-red-700">
              {call.pipeline_error[call.pipeline_error.length - 1].replace(/^analyze:\s*/i, "")}
            </p>
            {call.transcript && (
              <p className="break-words text-sm text-muted-foreground line-clamp-3">{call.transcript.full_text}</p>
            )}
            <Button
              size="sm"
              variant="outline"
              disabled={retrying}
              onClick={() => onRetry(call.call_id)}
              className="gap-2 rounded-xl"
            >
              {retrying && <Loader2 className="h-3 w-3 animate-spin" />}
              Retry review
            </Button>
          </>
        ) : call.transcript ? (
          <>
            <p className="text-sm text-amber-700">Almost done — finishing review...</p>
            <p className="break-words text-sm text-muted-foreground line-clamp-3">{call.transcript.full_text}</p>
            <Button
              size="sm"
              variant="outline"
              disabled={retrying}
              onClick={() => onRetry(call.call_id)}
              className="gap-2 rounded-xl"
            >
              {retrying && <Loader2 className="h-3 w-3 animate-spin" />}
              Retry review
            </Button>
          </>
        ) : (
          <p className="text-sm text-muted-foreground">Processing your recording...</p>
        )}
      </div>

      <div className="mt-4 flex flex-wrap gap-2 border-t border-border/40 pt-4">
        <Button
          size="sm"
          variant="outline"
          disabled={!call.transcript}
          onClick={() => setShowTranscript((open) => !open)}
          className="gap-2 rounded-xl"
        >
          <FileText className="h-3.5 w-3.5" />
          {showTranscript ? LABELS.hideTranscript : LABELS.viewTranscript}
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={() => setShowPlayer((open) => !open)}
          className="gap-2 rounded-xl"
        >
          <Headphones className="h-3.5 w-3.5" />
          {showPlayer ? LABELS.hidePlayer : LABELS.listenToRecording}
        </Button>
      </div>

      {showTranscript && (
        <div className="mt-3 rounded-xl bg-slate-50 p-4">
          {call.transcript ? (
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground">
              {call.transcript.full_text}
            </p>
          ) : (
            <p className="text-sm text-muted-foreground">{LABELS.transcriptUnavailable}</p>
          )}
        </div>
      )}

      {showPlayer && (
        <div className="mt-3 rounded-xl bg-slate-50 p-4">
          <audio controls preload="metadata" className="w-full" src={callAudioUrl(call.call_id)}>
            Your browser does not support audio playback.
          </audio>
        </div>
      )}
    </div>
  );
}
