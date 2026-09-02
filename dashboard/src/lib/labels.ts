export const LABELS = {
  addRecordings: "Add Recordings",
  findRecurringIssues: "Find Recurring Issues",
  recurringIssues: "Recurring Issues",
  yourRecordings: "Your Recordings",
  dashboard: "Dashboard",
  likelyRootCause: "Likely root cause",
  whatToDoNext: "What to do next",
  mentionedInCalls: (n: number) => `Mentioned in ${n} call${n === 1 ? "" : "s"}`,
  callsReviewed: "Calls Reviewed",
  issuesFound: "Issues Found",
  callsReady: "Calls Ready",
  topIssues: "Top Recurring Issues",
  recentActivity: "Recent Activity",
  viewAll: "View all",
  getStartedTitle: "Get started with your call recordings",
  getStartedBody:
    "Add call recordings about the same type of problem. We need at least 5 similar reviewed calls before a recurring issue can be surfaced.",
  noPatternsFound:
    "Your calls cover different topics. Upload more recordings about the same issue, then try again.",
  callsTrend: "Calls Reviewed Over Time",
  issuesTrend: "Recurring Issues Over Time",
  daily: "Daily",
  weekly: "Weekly",
  monthly: "Monthly",
  noIssuesYet: "No recurring issues found yet.",
  noRecordingsYet: "No recordings yet. Add your first batch above.",
  processingComplete: "Processing complete",
  recordingsAdded: (n: number) => `${n} recording${n === 1 ? "" : "s"} added`,
} as const;

export function priorityLabel(severity: number): string {
  if (severity >= 5) return "Critical";
  if (severity >= 4) return "High priority";
  if (severity >= 3) return "Medium priority";
  return "Low priority";
}

export function priorityClass(severity: number): string {
  if (severity >= 5) return "bg-red-100 text-red-700 border-red-200";
  if (severity >= 4) return "bg-orange-100 text-orange-700 border-orange-200";
  if (severity >= 3) return "bg-amber-100 text-amber-700 border-amber-200";
  return "bg-slate-100 text-slate-600 border-slate-200";
}

export function matchStrengthLabel(confidence: number): string {
  const pct = confidence <= 1 ? confidence * 100 : confidence;
  if (pct >= 90) return "Very strong match";
  if (pct >= 75) return "Strong match";
  return "Possible match";
}

export function matchStrengthClass(confidence: number): string {
  const pct = confidence <= 1 ? confidence * 100 : confidence;
  if (pct >= 90) return "text-primary font-semibold";
  if (pct >= 75) return "text-primary font-medium";
  return "text-muted-foreground";
}

export function trendLabel(trend: string): string {
  if (trend === "up") return "Getting worse";
  if (trend === "down") return "Improving";
  return "Steady";
}

export function trendClass(trend: string): string {
  if (trend === "up") return "bg-red-50 text-red-700 border-red-200";
  if (trend === "down") return "bg-emerald-50 text-emerald-700 border-emerald-200";
  return "bg-slate-50 text-slate-600 border-slate-200";
}

export function statusLabel(status: string): string {
  if (status === "analyzed") return "Ready";
  if (status === "transcribed") return "Transcribing";
  return "Processing";
}

export function statusClass(status: string): string {
  if (status === "analyzed") return "bg-emerald-50 text-emerald-700 border-emerald-200";
  if (status === "transcribed") return "bg-amber-50 text-amber-700 border-amber-200";
  return "bg-slate-50 text-slate-600 border-slate-200";
}

export function categoryLabel(category: string): string {
  const map: Record<string, string> = {
    product: "Product",
    shipping: "Shipping",
    billing: "Billing",
    returns: "Returns",
    account: "Account",
    technical: "Technical",
    other: "Other",
  };
  return map[category] || category;
}

export function timeAgo(dateStr: string): string {
  const date = new Date(dateStr);
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return "Just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}
