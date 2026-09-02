"use client";

import { useMemo, useState } from "react";
import { CallRecord, InsightSummary } from "@/lib/api";
import { sparklineData } from "@/lib/chart-data";
import { LABELS } from "@/lib/labels";
import { CallsTrendChart } from "@/components/charts/calls-trend-chart";
import { IssuesTrendChart } from "@/components/charts/issues-trend-chart";
import { ActivityFeed } from "@/components/dashboard/activity-feed";
import { IssuesTable } from "@/components/dashboard/issues-table";
import { KpiCard } from "@/components/dashboard/kpi-card";
import { DownloadSampleRecordingsButton } from "@/components/actions/download-sample-recordings-button";
import { TopHeader } from "@/components/layout/top-header";

interface DashboardHomeProps {
  insights: InsightSummary[];
  calls: CallRecord[];
}

export function DashboardHome({ insights, calls }: DashboardHomeProps) {
  const [search, setSearch] = useState("");

  const analyzedCalls = calls.filter((c) => c.status === "analyzed");
  const readyCount = analyzedCalls.length;
  const callsSpark = sparklineData(analyzedCalls, (c) => c.analysis?.created_at);
  const issuesSpark = sparklineData(insights, (i) => i.created_at, (i) => i.frequency);

  const filteredInsights = useMemo(() => {
    if (!search) return insights;
    const q = search.toLowerCase();
    return insights.filter((i) => i.title.toLowerCase().includes(q));
  }, [insights, search]);

  const isEmpty = calls.length === 0 && insights.length === 0;

  return (
    <div className="min-w-0 space-y-6">
      <TopHeader search={search} onSearchChange={setSearch} />

      {isEmpty ? (
        <div className="rounded-2xl bg-white p-6 text-center shadow-sm sm:p-10">
          <h2 className="text-lg font-semibold sm:text-xl">{LABELS.getStartedTitle}</h2>
          <p className="mx-auto mt-2 max-w-lg text-sm text-muted-foreground">{LABELS.getStartedBody}</p>
          <div className="mt-6 flex justify-center">
            <DownloadSampleRecordingsButton />
          </div>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <KpiCard
              title={LABELS.callsReviewed}
              value={readyCount}
              subtitle={`${calls.length} total uploaded`}
              sparkline={callsSpark}
            />
            <KpiCard
              title={LABELS.issuesFound}
              value={insights.length}
              subtitle={`${insights.reduce((s, i) => s + i.frequency, 0)} calls linked to issues`}
              sparkline={issuesSpark}
              accent="#14b8a6"
            />
            <KpiCard
              title={LABELS.callsReady}
              value={calls.length ? `${Math.round((readyCount / calls.length) * 100)}%` : "0%"}
              subtitle={`${readyCount} of ${calls.length} recordings reviewed`}
              accent="#f97316"
            />
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <CallsTrendChart items={analyzedCalls.map((c) => ({ created_at: c.analysis?.created_at }))} />
            <IssuesTrendChart insights={insights} />
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <IssuesTable insights={filteredInsights} />
            </div>
            <ActivityFeed calls={calls} insights={insights} />
          </div>
        </>
      )}
    </div>
  );
}
