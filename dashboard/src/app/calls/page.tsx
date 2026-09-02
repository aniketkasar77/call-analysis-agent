"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader2, Phone, RefreshCw, Search } from "lucide-react";
import { api, CallRecord } from "@/lib/api";
import { LABELS } from "@/lib/labels";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AddRecordingsButton } from "@/components/actions/add-recordings-button";
import { DownloadSampleRecordingsButton } from "@/components/actions/download-sample-recordings-button";
import { CallCard } from "@/components/calls/call-card";

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
        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:gap-3">
          <AddRecordingsButton className="w-full sm:w-auto" />
          <DownloadSampleRecordingsButton className="w-full sm:w-auto" />
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
          <div className="mt-4 flex justify-center">
            <DownloadSampleRecordingsButton />
          </div>
        </div>
      ) : (
        <div className="grid gap-4">
          {filtered.map((call) => (
            <CallCard
              key={call.call_id}
              call={call}
              retrying={retrying === call.call_id}
              onRetry={retry}
            />
          ))}
        </div>
      )}
    </div>
  );
}
