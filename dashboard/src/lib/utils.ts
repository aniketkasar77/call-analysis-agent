import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatPercent(value: number) {
  return `${Math.round(value * 100)}%`;
}

export function trendColor(trend: string) {
  if (trend === "up") return "text-red-600 bg-red-50 border-red-200 dark:bg-red-950/40 dark:border-red-900 dark:text-red-400";
  if (trend === "down") return "text-emerald-600 bg-emerald-50 border-emerald-200 dark:bg-emerald-950/40 dark:border-emerald-900 dark:text-emerald-400";
  return "text-slate-600 bg-slate-50 border-slate-200 dark:bg-slate-900 dark:border-slate-700 dark:text-slate-400";
}

export function severityColor(severity: number) {
  if (severity >= 4) return "text-red-600 bg-red-50 border-red-200";
  if (severity >= 3) return "text-amber-600 bg-amber-50 border-amber-200";
  return "text-slate-600 bg-slate-50 border-slate-200";
}

export function statusColor(status: string) {
  if (status === "analyzed") return "text-emerald-700 bg-emerald-50 border-emerald-200";
  if (status === "transcribed") return "text-amber-700 bg-amber-50 border-amber-200";
  return "text-slate-600 bg-slate-50 border-slate-200";
}
