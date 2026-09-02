import Link from "next/link";
import { ArrowLeft, Lightbulb, Wrench } from "lucide-react";
import { api } from "@/lib/api";
import {
  LABELS,
  matchStrengthClass,
  matchStrengthLabel,
  priorityClass,
  priorityLabel,
  trendClass,
  trendLabel,
} from "@/lib/labels";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export default async function InsightDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  let insight = null;
  try {
    insight = await api.getInsight(id);
  } catch {
    insight = null;
  }

  if (!insight) {
    return (
      <div className="rounded-2xl bg-white p-10 text-center shadow-sm">
        <p className="text-muted-foreground">Issue not found.</p>
        <Button asChild variant="link" className="mt-4">
          <Link href="/insights">Back to recurring issues</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="min-w-0 space-y-6">
      <Button asChild variant="ghost" className="gap-2 pl-0">
        <Link href="/insights">
          <ArrowLeft className="h-4 w-4" /> Back to recurring issues
        </Link>
      </Button>

      <div className="rounded-2xl bg-white p-4 shadow-sm sm:p-6">
        <div className="flex flex-wrap gap-2">
          <Badge className={priorityClass(insight.avg_severity)}>
            {priorityLabel(insight.avg_severity)}
          </Badge>
          <Badge className={trendClass(insight.trend)}>{trendLabel(insight.trend)}</Badge>
          <span className={`text-sm ${matchStrengthClass(insight.confidence)}`}>
            {matchStrengthLabel(insight.confidence)}
          </span>
          <Badge className="border bg-muted">{LABELS.mentionedInCalls(insight.frequency)}</Badge>
        </div>
        <h1 className="mt-4 text-xl font-bold sm:text-2xl">{insight.title}</h1>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl bg-white p-4 shadow-sm sm:p-6">
          <h2 className="flex items-center gap-2 font-semibold">
            <Lightbulb className="h-4 w-4 text-primary" /> Summary
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{insight.summary}</p>
        </div>
        <div className="rounded-2xl border border-primary/10 bg-primary/5 p-4 shadow-sm sm:p-6">
          <h2 className="flex items-center gap-2 font-semibold">
            <Wrench className="h-4 w-4 text-primary" /> {LABELS.whatToDoNext}
          </h2>
          <p className="mt-3 text-sm leading-relaxed">{insight.recommended_fix}</p>
        </div>
      </div>

      <div className="rounded-2xl bg-white p-4 shadow-sm sm:p-6">
        <h2 className="font-semibold">Related calls</h2>
        <p className="text-sm text-muted-foreground">
          {insight.supporting_calls.length} calls mentioned this issue
        </p>
        <div className="mt-4 space-y-4">
          {insight.supporting_calls.map((call) => (
            <div key={call.call_id} className="border-b border-border/60 pb-4 last:border-0">
              <p className="font-medium">{call.analysis?.primary_reason || call.call_id}</p>
              {call.analysis && (
                <p className="mt-1 text-sm text-primary">
                  {LABELS.likelyRootCause}: {call.analysis.upstream_issue_hypothesis}
                </p>
              )}
              {call.transcript && (
                <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
                  {call.transcript.full_text}
                </p>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
