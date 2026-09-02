"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, RefreshCw } from "lucide-react";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";

export function AggregateButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const run = async () => {
    setLoading(true);
    setMessage("");
    try {
      await api.runAggregate();
      setMessage("Aggregation complete");
      router.refresh();
    } catch (e) {
      setMessage((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center gap-3">
      {message && <span className="text-sm text-muted-foreground">{message}</span>}
      <Button onClick={run} disabled={loading} className="gap-2">
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
        Run Aggregation
      </Button>
    </div>
  );
}
