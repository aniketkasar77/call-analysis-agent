import { api } from "@/lib/api";
import { DashboardHome } from "@/components/dashboard/dashboard-home";

async function getData() {
  try {
    const [insights, calls] = await Promise.all([api.getInsights(), api.getCalls()]);
    return { insights, calls };
  } catch {
    return { insights: [], calls: [] };
  }
}

export default async function HomePage() {
  const { insights, calls } = await getData();
  return <DashboardHome insights={insights} calls={calls} />;
}
