import { CallRecord, InsightSummary } from "@/lib/api";
import { LABELS, timeAgo } from "@/lib/labels";

interface ActivityFeedProps {
  calls: CallRecord[];
  insights: InsightSummary[];
}

export function ActivityFeed({ calls, insights }: ActivityFeedProps) {
  const activities: { id: string; text: string; time: string }[] = [];

  for (const insight of insights.slice(0, 5)) {
    activities.push({
      id: `insight-${insight.insight_id}`,
      text: `New recurring issue found: ${insight.title}`,
      time: insight.created_at,
    });
  }

  for (const call of calls.filter((c) => c.status === "analyzed").slice(0, 5)) {
    activities.push({
      id: `call-${call.call_id}`,
      text: call.analysis?.primary_reason
        ? `Call reviewed — ${call.analysis.primary_reason}`
        : "Call recording reviewed",
      time: call.analysis?.created_at || "",
    });
  }

  const sorted = activities
    .filter((a) => a.time)
    .sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())
    .slice(0, 6);

  return (
    <div className="min-w-0 overflow-hidden rounded-2xl bg-white p-4 shadow-sm sm:p-6">
      <h3 className="mb-4 font-semibold">{LABELS.recentActivity}</h3>
      {sorted.length === 0 ? (
        <p className="text-sm text-muted-foreground">No activity yet.</p>
      ) : (
        <ul className="space-y-4">
          {sorted.map((item, i) => (
            <li key={item.id} className="flex min-w-0 gap-3">
              <div className="flex shrink-0 flex-col items-center">
                <div
                  className={`h-2.5 w-2.5 rounded-full ${i === 0 ? "bg-primary" : "border-2 border-muted-foreground/30 bg-white"}`}
                />
                {i < sorted.length - 1 && <div className="mt-1 w-px flex-1 bg-border" />}
              </div>
              <div className="min-w-0 flex-1 pb-2">
                <p className="break-words text-sm leading-snug">{item.text}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">{timeAgo(item.time)}</p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
