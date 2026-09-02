"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader2, Phone, RefreshCw, Search } from "lucide-react";
import { api, CallRecord } from "@/lib/api";
import { LABELS, categoryLabel, statusClass, statusLabel } from "@/lib/labels";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AddRecordingsButton } from "@/components/actions/add-recordings-button";

export default function CallsPage() {
  const [calls, setCalls] = useState<CallRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [retrying, setRetrying] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setCalls(await api.getCalls());
    } catch {
      setCalls([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const retry = async (callId: string) => {
    setRetrying(callId);
    try {
      await api.runPipeline(callId);
      await load();
    } finally {
      setRetrying(null);
    }
  };

  const filtered = calls.filter(
    (c) =>
      c.call_id.toLowerCase().includes(search.toLowerCase()) ||
      c.analysis?.primary_reason?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-w-0 space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-xl font-bold sm:text-2xl">{LABELS.yourRecordings}</h1>
          <p className="text-sm text-muted-foreground">Track the status of your uploaded calls</p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:gap-3">
          <AddRecordingsButton className="w-full sm:w-auto" />
          <Button
            variant="outline"
            onClick={load}
            className="h-11 w-full gap-2 rounded-2xl border-0 bg-white shadow-sm sm:w-auto"
          >
            <RefreshCw className="h-4 w-4" /> Refresh
          </Button>
        </div>
      </div>

      <div className="relative w-full sm:max-w-md">
        <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search recordings..."
          className="h-11 rounded-2xl border-0 bg-white pl-11 shadow-sm"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {loading ? (
        <div className="flex items-center justify-center gap-2 py-20 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" /> Loading...
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl bg-white p-10 text-center shadow-sm">
          <Phone className="mx-auto h-8 w-8 text-muted-foreground" />
          <p className="mt-3 text-muted-foreground">{LABELS.noRecordingsYet}</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {filtered.map((call) => (
            <div key={call.call_id} className="min-w-0 overflow-hidden rounded-2xl bg-white p-4 shadow-sm sm:p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1 space-y-1">
                  <p className="truncate font-mono text-xs text-muted-foreground sm:text-sm">{call.call_id}</p>
                  <p className="text-sm">
                    {call.analysis?.category
                      ? categoryLabel(call.analysis.category)
                      : "Awaiting review"}
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
                ) : call.transcript ? (
                  <>
                    <p className="text-sm text-amber-700">Almost done — finishing review...</p>
                    <p className="break-words text-sm text-muted-foreground line-clamp-3">{call.transcript.full_text}</p>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={retrying === call.call_id}
                      onClick={() => retry(call.call_id)}
                      className="gap-2 rounded-xl"
                    >
                      {retrying === call.call_id && <Loader2 className="h-3 w-3 animate-spin" />}
                      Retry review
                    </Button>
                  </>
                ) : (
                  <p className="text-sm text-muted-foreground">Processing your recording...</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
