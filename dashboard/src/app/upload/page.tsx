"use client";

import { useCallback, useRef, useState } from "react";
import { CheckCircle2, Loader2, UploadCloud } from "lucide-react";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export default function UploadPage() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [dragging, setDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ call_id: string } | null>(null);
  const [error, setError] = useState("");

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const dropped = e.dataTransfer.files[0];
    if (dropped) setFile(dropped);
  }, []);

  const upload = async () => {
    if (!file) return;
    setLoading(true);
    setError("");
    setResult(null);
    try {
      const res = await api.uploadCall(file);
      setResult(res);
      setFile(null);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl space-y-8 p-8">
      <div className="space-y-1">
        <p className="text-sm font-medium text-primary">Ingestion</p>
        <h1 className="text-3xl font-bold tracking-tight">Upload Call Audio</h1>
        <p className="text-muted-foreground">
          Upload a support call recording. The pipeline will transcribe and analyze it automatically.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Audio file</CardTitle>
          <CardDescription>Supports WAV, MP3, M4A and other common formats.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div
            onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={onDrop}
            className={cn(
              "relative flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed p-12 transition-colors",
              dragging ? "border-primary bg-primary/5" : "border-muted-foreground/25 hover:border-primary/50"
            )}
          >
            <UploadCloud className={cn("h-10 w-10", dragging ? "text-primary" : "text-muted-foreground")} />
            <div className="text-center">
              <p className="font-medium">Drag & drop your audio file here</p>
              <p className="text-sm text-muted-foreground">or click to browse</p>
            </div>
            <Button type="button" variant="outline" size="sm" onClick={() => inputRef.current?.click()}>
              Browse files
            </Button>
            <input
              ref={inputRef}
              type="file"
              accept="audio/*"
              className="hidden"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
            />
          </div>

          {file && (
            <div className="flex items-center justify-between rounded-lg bg-muted px-4 py-3 text-sm">
              <span className="truncate font-medium">{file.name}</span>
              <span className="text-muted-foreground">{(file.size / 1024 / 1024).toFixed(1)} MB</span>
            </div>
          )}

          <Button onClick={upload} disabled={!file || loading} className="w-full gap-2" size="lg">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <UploadCloud className="h-4 w-4" />}
            {loading ? "Uploading & processing..." : "Upload & Process"}
          </Button>

          {result && (
            <div className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              Uploaded <span className="font-mono">{result.call_id}</span> — processing started.
            </div>
          )}
          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
              {error}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
