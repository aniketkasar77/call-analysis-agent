import Link from "next/link";
import { InsightSummary } from "@/lib/api";
import {
  LABELS,
  matchStrengthClass,
  matchStrengthLabel,
  priorityClass,
  priorityLabel,
  timeAgo,
} from "@/lib/labels";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface IssuesTableProps {
  insights: InsightSummary[];
}

export function IssuesTable({ insights }: IssuesTableProps) {
  const top = [...insights]
    .sort((a, b) => b.avg_severity - a.avg_severity || b.confidence - a.confidence)
    .slice(0, 5);

  return (
    <div className="min-w-0 overflow-hidden rounded-2xl bg-white p-4 shadow-sm sm:p-6">
      <div className="mb-4 flex items-center justify-between gap-2">
        <h3 className="font-semibold">{LABELS.topIssues}</h3>
        <Link href="/insights" className="shrink-0 text-sm font-medium text-primary hover:underline">
          {LABELS.viewAll}
        </Link>
      </div>
      {top.length === 0 ? (
        <p className="text-sm text-muted-foreground">{LABELS.noIssuesYet}</p>
      ) : (
        <>
          {/* Mobile card list */}
          <div className="space-y-3 md:hidden">
            {top.map((insight) => (
              <Link
                key={insight.insight_id}
                href={`/insights/${insight.insight_id}`}
                className="block min-w-0 overflow-hidden rounded-xl border border-border/60 p-4 transition-colors hover:border-primary/30"
              >
                <p className="break-words font-medium leading-snug">{insight.title}</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  <Badge className={priorityClass(insight.avg_severity)}>
                    {priorityLabel(insight.avg_severity)}
                  </Badge>
                  <span className={`text-xs ${matchStrengthClass(insight.confidence)}`}>
                    {matchStrengthLabel(insight.confidence)}
                  </span>
                </div>
                <p className="mt-2 text-xs text-muted-foreground">
                  {LABELS.mentionedInCalls(insight.frequency)} · {timeAgo(insight.created_at)}
                </p>
              </Link>
            ))}
          </div>

          {/* Desktop table */}
          <div className="hidden md:block">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead>Issue</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Match</TableHead>
                  <TableHead className="text-right">Calls</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {top.map((insight) => (
                  <TableRow key={insight.insight_id}>
                    <TableCell>
                      <Link href={`/insights/${insight.insight_id}`} className="group block">
                        <p className="font-medium group-hover:text-primary">{insight.title}</p>
                        <p className="text-xs text-muted-foreground">{timeAgo(insight.created_at)}</p>
                      </Link>
                    </TableCell>
                    <TableCell>
                      <Badge className={priorityClass(insight.avg_severity)}>
                        {priorityLabel(insight.avg_severity)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span className={matchStrengthClass(insight.confidence)}>
                        {matchStrengthLabel(insight.confidence)}
                      </span>
                    </TableCell>
                    <TableCell className="text-right text-muted-foreground">
                      {LABELS.mentionedInCalls(insight.frequency)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </>
      )}
    </div>
  );
}
