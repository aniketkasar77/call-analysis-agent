const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export const callAudioUrl = (callId: string) =>
  `${API_URL}/calls/${encodeURIComponent(callId)}/audio`;

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
  pipeline_error?: string[] | null;
  transcript: { full_text: string; created_at?: string } | null;
  analysis: {
    primary_reason: string;
    category: string;
    severity: number;
    upstream_issue_hypothesis: string;
    sentiment?: string;
    created_at?: string;
  } | null;
}

export interface AggregateResult {
  surfaced_count: number;
  analyzed_calls: number;
  clusters_detected: number;
  max_cluster_size: number;
  min_cluster_size: number;
  message: string;
  errors?: string[];
}

export interface BatchUploadResult {
  count: number;
  uploads: Array<{
    call_id: string;
    filename: string;
    status: string;
  }>;
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
  uploadCalls: async (files: File[]): Promise<BatchUploadResult> => {
    const form = new FormData();
    files.forEach((f) => form.append("files", f));
    const res = await fetch(`${API_URL}/calls/upload/batch`, { method: "POST", body: form });
    if (!res.ok) throw new Error("Upload failed");
    return res.json();
  },
  findRecurringIssues: () => fetchJson<AggregateResult>("/pipeline/aggregate", { method: "POST" }),
  runPipeline: (callId: string) => fetchJson(`/pipeline/run/${callId}`, { method: "POST" }),
  downloadSampleRecordings: async () => {
    const res = await fetch(`${API_URL}/calls/sample-recordings/download`);
    if (!res.ok) {
      const text = await res.text();
      throw new Error(text || "Download failed");
    }
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "sample-call-recordings.zip";
    link.click();
    URL.revokeObjectURL(url);
  },
};
