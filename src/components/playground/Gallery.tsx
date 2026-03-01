import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useMutation } from "convex/react";
import { Download, Loader2, CheckCircle2, XCircle, ImageIcon, Film, BookmarkPlus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { Generation } from "@/types";
import { MODELS } from "@/lib/models";

interface Props {
  userId: string;
  onSelectGeneration?: (gen: Generation) => void;
}

export function Gallery({ userId, onSelectGeneration }: Props) {
  const generations = useQuery(api.generations.listGenerations, { userId }) as Generation[] | undefined;
  const createAsset = useMutation(api.assets.createAsset);
  const generateUploadUrl = useMutation(api.assets.generateUploadUrl);

  const [saving, setSaving] = useState<string | null>(null);

  const handleSaveAsAsset = async (gen: Generation) => {
    if (!gen.outputUrl) return;
    setSaving(gen._id);
    try {
      // Download output and save as asset
      const res = await fetch(gen.outputUrl);
      const blob = await res.blob();
      const uploadUrl = await generateUploadUrl();
      const uploadRes = await fetch(uploadUrl, {
        method: "POST",
        headers: { "Content-Type": blob.type || "image/webp" },
        body: blob,
      });
      if (!uploadRes.ok) throw new Error("Upload failed");
      const { storageId } = await uploadRes.json();
      await createAsset({
        userId,
        label: `Gen-${gen._id.slice(-6)}`,
        storageId,
        sourceType: "generated",
        mimeType: blob.type || "image/webp",
      });
      alert("Saved to asset library!");
    } catch {
      alert("Failed to save asset.");
    } finally {
      setSaving(null);
    }
  };

  const handleDownload = (gen: Generation) => {
    if (!gen.outputUrl) return;
    const a = document.createElement("a");
    a.href = gen.outputUrl;
    a.download = `curie-lab-${gen._id}.${gen.mediaType === "video" ? "mp4" : "webp"}`;
    a.click();
  };

  if (!generations) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-[#7c3aed]" />
      </div>
    );
  }

  if (generations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-3 text-[#9ca3af]">
        <div className="w-16 h-16 rounded-2xl bg-[#f4f0ff] flex items-center justify-center">
          <ImageIcon className="h-8 w-8 text-[#7c3aed]/40" />
        </div>
        <p className="text-sm">No generations yet. Create your first one above!</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {generations.map((gen) => (
        <GalleryCard
          key={gen._id}
          generation={gen}
          onSelect={onSelectGeneration}
          onDownload={handleDownload}
          onSaveAsAsset={handleSaveAsAsset}
          saving={saving === gen._id}
        />
      ))}
    </div>
  );
}

function GalleryCard({
  generation: gen,
  onSelect,
  onDownload,
  onSaveAsAsset,
  saving,
}: {
  generation: Generation;
  onSelect?: (g: Generation) => void;
  onDownload: (g: Generation) => void;
  onSaveAsAsset: (g: Generation) => void;
  saving: boolean;
}) {
  const model = MODELS.find((m) => m.key === gen.modelKey);

  const statusIcon = () => {
    switch (gen.status) {
      case "queued":
        return <Loader2 className="h-3 w-3" />;
      case "processing":
        return <Loader2 className="h-3 w-3 animate-spin" />;
      case "completed":
        return <CheckCircle2 className="h-3 w-3" />;
      case "failed":
        return <XCircle className="h-3 w-3" />;
    }
  };

  const statusVariant = (): "secondary" | "success" | "destructive" | "warning" => {
    switch (gen.status) {
      case "queued": return "warning";
      case "processing": return "secondary";
      case "completed": return "success";
      case "failed": return "destructive";
    }
  };

  return (
    <div
      className="group relative rounded-xl border border-[#e5e7eb] overflow-hidden bg-white shadow-sm hover:shadow-md transition-shadow cursor-pointer"
      onClick={() => onSelect?.(gen)}
    >
      {/* Media */}
      <div className="aspect-square bg-[#f8f8f8] relative overflow-hidden">
        {gen.status === "completed" && gen.outputUrl ? (
          gen.mediaType === "video" ? (
            <video
              src={gen.outputUrl}
              className="w-full h-full object-cover"
              autoPlay
              muted
              loop
              playsInline
            />
          ) : (
            <img
              src={gen.outputUrl}
              alt={gen.promptFinal}
              className="w-full h-full object-cover"
            />
          )
        ) : (
          <div className="flex items-center justify-center h-full">
            {gen.status === "failed" ? (
              <XCircle className="h-8 w-8 text-red-300" />
            ) : (
              <Loader2 className="h-8 w-8 text-[#7c3aed]/40 animate-spin" />
            )}
          </div>
        )}

        {/* Overlay actions */}
        {gen.status === "completed" && gen.outputUrl && (
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
            <Button
              size="icon"
              variant="secondary"
              className="h-8 w-8 bg-white/90 hover:bg-white"
              onClick={(e) => {
                e.stopPropagation();
                onDownload(gen);
              }}
            >
              <Download className="h-3.5 w-3.5" />
            </Button>
            {gen.mediaType === "image" && (
              <Button
                size="icon"
                variant="secondary"
                className="h-8 w-8 bg-white/90 hover:bg-white"
                onClick={(e) => {
                  e.stopPropagation();
                  onSaveAsAsset(gen);
                }}
                disabled={saving}
              >
                {saving ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <BookmarkPlus className="h-3.5 w-3.5" />
                )}
              </Button>
            )}
          </div>
        )}

        {/* Media type icon */}
        <div className="absolute top-1.5 left-1.5">
          {gen.mediaType === "video" ? (
            <span className="bg-black/50 rounded px-1.5 py-0.5 text-white text-[10px] font-medium flex items-center gap-0.5">
              <Film className="h-2.5 w-2.5" /> Video
            </span>
          ) : null}
        </div>
      </div>

      {/* Info */}
      <div className="p-2.5">
        <div className="flex items-center justify-between gap-1 mb-1">
          <Badge variant={statusVariant()} className="gap-1 text-[10px] h-4 px-1.5">
            {statusIcon()}
            <span className="capitalize">{gen.status}</span>
          </Badge>
          <span className="text-[10px] text-[#9ca3af]">{model?.name ?? gen.modelKey}</span>
        </div>
        <p className="text-xs text-[#6b7280] line-clamp-2 leading-snug">
          {gen.promptFinal || gen.promptOriginal}
        </p>
      </div>
    </div>
  );
}
