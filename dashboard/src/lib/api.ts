const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export interface InsightSummary {
  insight_id: string;
  title: string;
  frequency: number;
  avg_severity: number;
  trend: string;
  confidence: number;
  created_at: string;
}

export interface InsightDetail extends InsightSummary {
  summary: string;
  recommended_fix: string;
  theme: string;
  call_ids: string[];
  supporting_calls: Array<{
    call_id: string;
    transcript: { full_text: string } | null;
    analysis: {
      primary_reason: string;
      severity: number;
      category: string;
      upstream_issue_hypothesis: string;
    } | null;
  }>;
}

export interface CallRecord {
  call_id: string;
  status: string;
  transcript: { full_text: string } | null;
  analysis: {
    primary_reason: string;
    category: string;
    severity: number;
    upstream_issue_hypothesis: string;
    sentiment?: string;
  } | null;
}

async function fetchJson<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    cache: "no-store",
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `API error: ${res.status}`);
  }
  return res.json();
}

export const api = {
  getInsights: () => fetchJson<InsightSummary[]>("/insights"),
  getInsight: (id: string) => fetchJson<InsightDetail>(`/insights/${id}`),
  getCalls: () => fetchJson<CallRecord[]>("/calls"),
  getCall: (id: string) => fetchJson<CallRecord>(`/calls/${id}`),
  uploadCall: async (file: File) => {
    const form = new FormData();
    form.append("file", file);
    const res = await fetch(`${API_URL}/calls/upload`, { method: "POST", body: form });
    if (!res.ok) throw new Error("Upload failed");
    return res.json() as Promise<{ call_id: string; status: string }>;
  },
  runAggregate: () => fetchJson("/pipeline/aggregate", { method: "POST" }),
  runPipeline: (callId: string) =>
    fetchJson(`/pipeline/run/${callId}`, { method: "POST" }),
};
