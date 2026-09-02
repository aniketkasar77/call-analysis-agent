import Link from "next/link";
import { ArrowLeft, Lightbulb, Wrench } from "lucide-react";
import { api } from "@/lib/api";
import { formatPercent, severityColor, trendColor } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

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
      <div className="mx-auto max-w-3xl p-8 text-center">
        <p className="text-muted-foreground">Insight not found.</p>
        <Button asChild variant="link" className="mt-4">
          <Link href="/">Back to insights</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-8">
      <Button asChild variant="ghost" className="gap-2 pl-0">
        <Link href="/">
          <ArrowLeft className="h-4 w-4" /> Back to insights
        </Link>
      </Button>

      <div className="space-y-3">
        <div className="flex flex-wrap gap-2">
          <Badge className={trendColor(insight.trend)}>Trend: {insight.trend}</Badge>
          <Badge className={severityColor(insight.avg_severity)}>
            Severity {insight.avg_severity.toFixed(1)}
          </Badge>
          <Badge className="border bg-background">{insight.frequency} calls</Badge>
          <Badge className="border bg-background">{formatPercent(insight.confidence)} confidence</Badge>
        </div>
        <h1 className="text-3xl font-bold tracking-tight">{insight.title}</h1>
        <p className="text-sm text-muted-foreground">Theme: {insight.theme}</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Lightbulb className="h-4 w-4 text-primary" /> Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm leading-relaxed text-muted-foreground">{insight.summary}</p>
          </CardContent>
        </Card>
        <Card className="border-primary/20 bg-primary/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Wrench className="h-4 w-4 text-primary" /> Recommended Fix
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm leading-relaxed">{insight.recommended_fix}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Supporting Calls</CardTitle>
          <CardDescription>
            {insight.supporting_calls.length} calls contributed to this insight
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {insight.supporting_calls.map((call, i) => (
            <div key={call.call_id}>
              {i > 0 && <Separator className="mb-4" />}
              <div className="space-y-2">
                <p className="font-medium">{call.analysis?.primary_reason || call.call_id}</p>
                {call.analysis && (
                  <p className="text-sm text-primary">{call.analysis.upstream_issue_hypothesis}</p>
                )}
                {call.transcript && (
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {call.transcript.full_text}
                  </p>
                )}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
