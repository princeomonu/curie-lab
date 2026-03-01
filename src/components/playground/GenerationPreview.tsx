import { Download, Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { Generation } from "@/types";

interface Props {
  generation: Generation | null;
  loading?: boolean;
}

export function GenerationPreview({ generation, loading }: Props) {
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-[#7c3aed]" />
        <p className="text-sm text-[#6b7280]">Starting generation…</p>
      </div>
    );
  }

  if (!generation) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3 text-[#9ca3af]">
        <div className="w-16 h-16 rounded-2xl bg-[#f4f0ff] flex items-center justify-center">
          <span className="text-3xl">🎬</span>
        </div>
        <p className="text-sm text-center">Your generation will appear here</p>
      </div>
    );
  }

  const statusBadge = () => {
    switch (generation.status) {
      case "queued":
        return <Badge variant="warning">Queued</Badge>;
      case "processing":
        return (
          <Badge variant="secondary" className="gap-1">
            <Loader2 className="h-3 w-3 animate-spin" />
            Processing
          </Badge>
        );
      case "completed":
        return <Badge variant="success">Completed</Badge>;
      case "failed":
        return <Badge variant="destructive">Failed</Badge>;
    }
  };

  const handleDownload = () => {
    if (!generation.outputUrl) return;
    const a = document.createElement("a");
    a.href = generation.outputUrl;
    a.download = `curie-lab-${generation._id}.${generation.mediaType === "video" ? "mp4" : "webp"}`;
    a.click();
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {statusBadge()}
          <span className="text-xs text-[#9ca3af]">
            {new Date(generation.createdAt).toLocaleTimeString()}
          </span>
        </div>
        {generation.status === "completed" && generation.outputUrl && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleDownload}
            className="gap-1 h-7 text-xs"
          >
            <Download className="h-3 w-3" />
            Download
          </Button>
        )}
      </div>

      <div className="rounded-lg border border-[#e5e7eb] overflow-hidden bg-[#f8f8f8] min-h-48 flex items-center justify-center">
        {generation.status === "processing" || generation.status === "queued" ? (
          <div className="flex flex-col items-center gap-3 py-12">
            <div className="relative">
              <div className="w-12 h-12 rounded-full border-2 border-[#7c3aed] border-t-transparent animate-spin" />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-6 h-6 rounded-full bg-[#7c3aed]/10" />
              </div>
            </div>
            <div className="text-center">
              <p className="text-sm font-medium text-[#0f0f11]">
                {generation.status === "queued" ? "Waiting in queue…" : "Generating…"}
              </p>
              <p className="text-xs text-[#9ca3af] mt-1">This may take a few minutes</p>
            </div>
          </div>
        ) : generation.status === "failed" ? (
          <div className="flex flex-col items-center gap-2 py-12 px-4 text-center">
            <AlertCircle className="h-8 w-8 text-red-400" />
            <p className="text-sm font-medium text-red-600">Generation Failed</p>
            {generation.errorMessage && (
              <p className="text-xs text-[#6b7280]">{generation.errorMessage}</p>
            )}
          </div>
        ) : generation.outputUrl ? (
          generation.mediaType === "video" ? (
            <div className="relative w-full">
              <video
                src={generation.outputUrl}
                className="w-full rounded-lg"
                loop
                playsInline
                autoPlay
                muted
              />
            </div>
          ) : (
            <img
              src={generation.outputUrl}
              alt={generation.promptFinal}
              className="w-full rounded-lg object-contain max-h-96"
            />
          )
        ) : null}
      </div>

      {(generation.status === "completed" || generation.status === "failed") && (
        <div className="p-3 rounded-md bg-[#f8f8f8] border border-[#e5e7eb]">
          <p className="text-xs text-[#6b7280] mb-1">Prompt</p>
          <p className="text-xs text-[#0f0f11] line-clamp-3">{generation.promptFinal}</p>
        </div>
      )}
    </div>
  );
}
