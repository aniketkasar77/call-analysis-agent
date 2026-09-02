import Link from "next/link";
import { ArrowRight, RefreshCw, TrendingUp, Users, Zap } from "lucide-react";
import { api, InsightSummary } from "@/lib/api";
import { formatPercent, severityColor, trendColor } from "@/lib/utils";
import { AggregateButton } from "@/components/insights/aggregate-button";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

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
    <div className="mx-auto max-w-6xl space-y-8 p-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1">
          <p className="text-sm font-medium text-primary">Upstream Issue Detection</p>
          <h1 className="text-3xl font-bold tracking-tight">Surfaced Insights</h1>
          <p className="text-muted-foreground">
            Recurring operational patterns detected across your support calls.
          </p>
        </div>
        <AggregateButton />
      </div>

      {insights.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-3">
          <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-2">
                <Zap className="h-4 w-4" /> Active Insights
              </CardDescription>
              <CardTitle className="text-3xl">{insights.length}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-2">
                <Users className="h-4 w-4" /> Total Calls Linked
              </CardDescription>
              <CardTitle className="text-3xl">
                {insights.reduce((s, i) => s + i.frequency, 0)}
              </CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4" /> Avg Confidence
              </CardDescription>
              <CardTitle className="text-3xl">
                {formatPercent(insights.reduce((s, i) => s + i.confidence, 0) / insights.length)}
              </CardTitle>
            </CardHeader>
          </Card>
        </div>
      )}

      {insights.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center gap-4 py-16 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted">
              <RefreshCw className="h-6 w-6 text-muted-foreground" />
            </div>
            <div className="space-y-1">
              <p className="font-medium">No insights yet</p>
              <p className="max-w-sm text-sm text-muted-foreground">
                Upload calls or seed sample data, then run aggregation to surface recurring upstream issues.
              </p>
            </div>
            <div className="flex gap-3">
              <Button asChild variant="outline">
                <Link href="/upload">Upload calls</Link>
              </Button>
              <AggregateButton />
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {insights.map((insight) => (
            <Card
              key={insight.insight_id}
              className="group transition-all hover:border-primary/40 hover:shadow-md"
            >
              <CardHeader>
                <div className="flex flex-wrap gap-2">
                  <Badge className={trendColor(insight.trend)}>{insight.trend}</Badge>
                  <Badge className={severityColor(insight.avg_severity)}>
                    Severity {insight.avg_severity.toFixed(1)}
                  </Badge>
                  <Badge className="border-primary/30 bg-primary/5 text-primary">
                    {formatPercent(insight.confidence)} confidence
                  </Badge>
                </div>
                <CardTitle className="mt-2 text-base leading-snug group-hover:text-primary">
                  {insight.title}
                </CardTitle>
                <CardDescription>{insight.frequency} related calls</CardDescription>
              </CardHeader>
              <CardContent>
                <Button asChild variant="ghost" className="gap-2 px-0 hover:bg-transparent">
                  <Link href={`/insights/${insight.insight_id}`}>
                    View details <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
