"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader2, Phone, RefreshCw, Search } from "lucide-react";
import { api, CallRecord } from "@/lib/api";
import { cn, statusColor } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

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
    <div className="mx-auto max-w-6xl space-y-8 p-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1">
          <p className="text-sm font-medium text-primary">Call Pipeline</p>
          <h1 className="text-3xl font-bold tracking-tight">Processed Calls</h1>
          <p className="text-muted-foreground">Track transcription and analysis status per call.</p>
        </div>
        <Button variant="outline" onClick={load} className="gap-2">
          <RefreshCw className="h-4 w-4" /> Refresh
        </Button>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search by call ID or reason..."
          className="pl-9"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20 text-muted-foreground gap-2">
          <Loader2 className="h-5 w-5 animate-spin" /> Loading calls...
        </div>
      ) : filtered.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center gap-3 py-16 text-center">
            <Phone className="h-8 w-8 text-muted-foreground" />
            <p className="text-muted-foreground">No calls found. Upload audio to get started.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {filtered.map((call) => (
            <Card key={call.call_id} className="transition-shadow hover:shadow-md">
              <CardHeader className="flex flex-row items-start justify-between gap-4">
                <div className="space-y-1 min-w-0">
                  <CardTitle className="truncate font-mono text-sm">{call.call_id}</CardTitle>
                  <CardDescription>
                    {call.analysis?.category || "—"} · {call.analysis ? `Severity ${call.analysis.severity}/5` : "—"}
                  </CardDescription>
                </div>
                <Badge className={cn("shrink-0", statusColor(call.status))}>{call.status}</Badge>
              </CardHeader>
              <CardContent className="space-y-3">
                {call.analysis ? (
                  <>
                    <p className="font-medium">{call.analysis.primary_reason}</p>
                    <p className="text-sm text-muted-foreground">{call.analysis.upstream_issue_hypothesis}</p>
                  </>
                ) : call.transcript ? (
                  <>
                    <p className="text-sm text-amber-700 dark:text-amber-400">
                      Transcribed — waiting for Gemini analysis.
                    </p>
                    <p className="text-sm text-muted-foreground line-clamp-2">{call.transcript.full_text}</p>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={retrying === call.call_id}
                      onClick={() => retry(call.call_id)}
                      className="gap-2"
                    >
                      {retrying === call.call_id && <Loader2 className="h-3 w-3 animate-spin" />}
                      Retry analysis
                    </Button>
                  </>
                ) : (
                  <p className="text-sm text-muted-foreground">Processing transcription...</p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
