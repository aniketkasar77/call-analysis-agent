import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { FindIssuesButton } from "@/components/actions/find-issues-button";
import { api, InsightSummary } from "@/lib/api";
import {
  LABELS,
  matchStrengthClass,
  matchStrengthLabel,
  priorityClass,
  priorityLabel,
  timeAgo,
  trendClass,
  trendLabel,
} from "@/lib/labels";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

async function getInsights(): Promise<InsightSummary[]> {
  try {
    return await api.getInsights();
  } catch {
    return [];
  }
}

export default async function InsightsPage() {
  const insights = await getInsights();

  return (
    <div className="min-w-0 space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-xl font-bold sm:text-2xl">{LABELS.recurringIssues}</h1>
          <p className="text-sm text-muted-foreground">
            Patterns detected across your support calls
          </p>
        </div>
        <FindIssuesButton className="w-full sm:w-auto" />
      </div>

      {insights.length === 0 ? (
        <div className="rounded-2xl bg-white p-10 text-center shadow-sm">
          <p className="text-muted-foreground">{LABELS.noIssuesYet}</p>
          <p className="mt-2 text-sm text-muted-foreground">{LABELS.getStartedBody}</p>
          <div className="mt-4 flex justify-center">
            <FindIssuesButton />
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {insights.map((insight) => (
            <div key={insight.insight_id} className="min-w-0 overflow-hidden rounded-2xl bg-white p-4 shadow-sm sm:p-6">
              <div className="flex flex-wrap gap-2">
                <Badge className={priorityClass(insight.avg_severity)}>
                  {priorityLabel(insight.avg_severity)}
                </Badge>
                <Badge className={trendClass(insight.trend)}>{trendLabel(insight.trend)}</Badge>
                <span className={`text-xs ${matchStrengthClass(insight.confidence)}`}>
                  {matchStrengthLabel(insight.confidence)}
                </span>
              </div>
              <h2 className="mt-3 break-words font-semibold leading-snug">{insight.title}</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                {LABELS.mentionedInCalls(insight.frequency)} · {timeAgo(insight.created_at)}
              </p>
              <Button asChild variant="ghost" className="mt-3 gap-2 px-0 hover:bg-transparent">
                <Link href={`/insights/${insight.insight_id}`}>
                  View details <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
