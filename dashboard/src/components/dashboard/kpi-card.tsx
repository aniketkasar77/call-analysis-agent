import { MiniSparkline } from "@/components/charts/mini-sparkline";
import { BRAND } from "@/lib/brand";
import { cn } from "@/lib/utils";

interface KpiCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  sparkline?: number[];
  accent?: string;
  className?: string;
}

export function KpiCard({ title, value, subtitle, sparkline, accent = BRAND.primary, className }: KpiCardProps) {
  return (
    <div className={cn("min-w-0 overflow-hidden rounded-2xl bg-white p-4 shadow-sm sm:p-5", className)}>
      <p className="text-sm text-muted-foreground">{title}</p>
      <p className="mt-1 text-3xl font-bold text-primary">{value}</p>
      {subtitle && <p className="mt-1 text-xs text-muted-foreground">{subtitle}</p>}
      {sparkline && sparkline.length > 0 && (
        <div className="mt-3">
          <MiniSparkline data={sparkline} color={accent} />
        </div>
      )}
    </div>
  );
}
