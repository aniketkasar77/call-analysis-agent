export type TimeRange = "daily" | "weekly" | "monthly";

export interface ChartPoint {
  key: string;
  label: string;
  value: number;
}

/** Backend stores UTC timestamps, often without a Z suffix. */
export function parseApiDate(raw: string | undefined): Date | null {
  if (!raw) return null;
  const normalized = /[zZ]|[+-]\d{2}:?\d{2}$/.test(raw) ? raw : `${raw}Z`;
  const date = new Date(normalized);
  return Number.isNaN(date.getTime()) ? null : date;
}

function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function localDateKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function startOfWeekMonday(d: Date): Date {
  const day = startOfDay(d);
  const dow = day.getDay();
  const diff = dow === 0 ? 6 : dow - 1;
  day.setDate(day.getDate() - diff);
  return day;
}

function monthKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function bucketKeyForDate(d: Date, range: TimeRange): string {
  if (range === "monthly") return monthKey(d);
  if (range === "weekly") return localDateKey(startOfWeekMonday(d));
  return localDateKey(d);
}

function periodCount(range: TimeRange): number {
  if (range === "monthly") return 6;
  if (range === "weekly") return 8;
  return 14;
}

function generatePeriodKeys(range: TimeRange, end = new Date()): string[] {
  const count = periodCount(range);
  const keys: string[] = [];

  if (range === "daily") {
    for (let i = count - 1; i >= 0; i--) {
      const d = startOfDay(end);
      d.setDate(d.getDate() - i);
      keys.push(localDateKey(d));
    }
    return keys;
  }

  if (range === "weekly") {
    for (let i = count - 1; i >= 0; i--) {
      const d = startOfDay(end);
      d.setDate(d.getDate() - i * 7);
      keys.push(localDateKey(startOfWeekMonday(d)));
    }
    return keys;
  }

  for (let i = count - 1; i >= 0; i--) {
    const d = new Date(end.getFullYear(), end.getMonth() - i, 1);
    keys.push(monthKey(d));
  }
  return keys;
}

function formatLabel(key: string, range: TimeRange): string {
  if (range === "monthly") {
    const [year, month] = key.split("-").map(Number);
    return new Date(year, month - 1, 1).toLocaleDateString("en-US", { month: "short" });
  }
  const [year, month, day] = key.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  if (range === "weekly") {
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  }
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

/**
 * Build a complete time series with zero-filled gaps so charts reflect the real timeline.
 */
export function buildChartSeries<T>(
  items: T[],
  range: TimeRange,
  getDate: (item: T) => string | undefined,
  getValue: (item: T) => number = () => 1
): ChartPoint[] {
  const keys = generatePeriodKeys(range);
  const counts = new Map<string, number>(keys.map((key) => [key, 0]));

  for (const item of items) {
    const date = parseApiDate(getDate(item));
    if (!date) continue;
    const key = bucketKeyForDate(date, range);
    if (counts.has(key)) {
      counts.set(key, (counts.get(key) || 0) + getValue(item));
    }
  }

  return keys.map((key) => ({
    key,
    label: formatLabel(key, range),
    value: counts.get(key) || 0,
  }));
}

/** Last N days of daily counts for KPI sparklines. */
export function sparklineData<T>(
  items: T[],
  getDate: (item: T) => string | undefined,
  getValue: (item: T) => number = () => 1,
  days = 7
): number[] {
  const end = new Date();
  const keys: string[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = startOfDay(end);
    d.setDate(d.getDate() - i);
    keys.push(localDateKey(d));
  }

  const counts = new Map<string, number>(keys.map((key) => [key, 0]));
  for (const item of items) {
    const date = parseApiDate(getDate(item));
    if (!date) continue;
    const key = localDateKey(date);
    if (counts.has(key)) {
      counts.set(key, (counts.get(key) || 0) + getValue(item));
    }
  }

  return keys.map((key) => counts.get(key) || 0);
}

/** @deprecated Use buildChartSeries */
export function bucketByDate<T extends { created_at?: string }>(
  items: T[],
  range: TimeRange,
  getDate: (item: T) => string | undefined
): ChartPoint[] {
  return buildChartSeries(items, range, getDate);
}
