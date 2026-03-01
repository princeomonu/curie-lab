import { useState, useRef } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Upload, Check, Trash2, Pencil, Loader2, ImageIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Asset } from "@/types";

interface Props {
  open: boolean;
  onClose: () => void;
  onSelect: (asset: Asset) => void;
  userId: string;
}

export function AssetLibraryModal({ open, onClose, onSelect, userId }: Props) {
  const assets = useQuery(api.assets.listAssets, { userId }) as Asset[] | undefined;
  const generateUploadUrl = useMutation(api.assets.generateUploadUrl);
  const createAsset = useMutation(api.assets.createAsset);
  const deleteAsset = useMutation(api.assets.deleteAsset);
  const updateLabel = useMutation(api.assets.updateAssetLabel);

  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editLabel, setEditLabel] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowed = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    if (!allowed.includes(file.type)) {
      alert("Only JPG, PNG, WebP, or GIF images are allowed.");
      return;
    }
    if (file.size > 20 * 1024 * 1024) {
      alert("File must be under 20MB.");
      return;
    }

    setUploading(true);
    try {
      const uploadUrl = await generateUploadUrl();
      const res = await fetch(uploadUrl, {
        method: "POST",
        headers: { "Content-Type": file.type },
        body: file,
      });
      if (!res.ok) throw new Error("Upload failed");
      const { storageId } = await res.json();

      const label = file.name.replace(/\.[^.]+$/, "").slice(0, 32);
      await createAsset({
        userId,
        label,
        storageId,
        sourceType: "upload",
        mimeType: file.type,
      });
    } catch (err) {
      console.error(err);
      alert("Upload failed. Please try again.");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const handleDelete = async (assetId: string) => {
    if (!confirm("Delete this asset?")) return;
    await deleteAsset({ assetId: assetId as Id<"assets">, userId });
    if (selectedId === assetId) setSelectedId(null);
  };

  const handleEditLabel = async (assetId: string) => {
    if (!editLabel.trim()) return;
    await updateLabel({
      assetId: assetId as Id<"assets">,
      label: editLabel.trim(),
      userId,
    });
    setEditingId(null);
  };

  const handleSelect = () => {
    const asset = assets?.find((a) => a._id === selectedId);
    if (asset) {
      onSelect(asset);
      onClose();
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Asset Library</DialogTitle>
          <DialogDescription>
            Upload images to use as reference assets in your prompts.
          </DialogDescription>
        </DialogHeader>

        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            size="sm"
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            className="gap-2"
          >
            {uploading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Upload className="h-4 w-4" />
            )}
            Upload Image
          </Button>
          <input
            ref={fileRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            className="hidden"
            onChange={handleUpload}
          />
          {selectedId && (
            <Button size="sm" onClick={handleSelect} className="gap-2">
              <Check className="h-4 w-4" />
              Use Selected
            </Button>
          )}
        </div>

        <ScrollArea className="h-[400px] pr-4">
          {!assets ? (
            <div className="flex items-center justify-center h-32">
              <Loader2 className="h-6 w-6 animate-spin text-[#7c3aed]" />
            </div>
          ) : assets.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-32 text-[#9ca3af] gap-2">
              <ImageIcon className="h-8 w-8" />
              <p className="text-sm">No assets yet. Upload an image to get started.</p>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-3 py-2">
              {assets.map((asset) => (
                <div
                  key={asset._id}
                  className={cn(
                    "group relative rounded-lg border-2 overflow-hidden cursor-pointer transition-all",
                    selectedId === asset._id
                      ? "border-[#7c3aed] shadow-md shadow-purple-100"
                      : "border-[#e5e7eb] hover:border-[#7c3aed]/40"
                  )}
                  onClick={() =>
                    setSelectedId(selectedId === asset._id ? null : asset._id)
                  }
                >
                  {asset.url ? (
                    <img
                      src={asset.url}
                      alt={asset.label}
                      className="w-full aspect-square object-cover"
                    />
                  ) : (
                    <div className="w-full aspect-square bg-[#f4f0ff] flex items-center justify-center">
                      <ImageIcon className="h-8 w-8 text-[#9ca3af]" />
                    </div>
                  )}

                  {selectedId === asset._id && (
                    <div className="absolute top-1 right-1 bg-[#7c3aed] rounded-full p-0.5">
                      <Check className="h-3 w-3 text-white" />
                    </div>
                  )}

                  <div className="p-2 bg-white">
                    {editingId === asset._id ? (
                      <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                        <Input
                          value={editLabel}
                          onChange={(e) => setEditLabel(e.target.value)}
                          className="h-6 text-xs"
                          onKeyDown={(e) => {
                            if (e.key === "Enter") handleEditLabel(asset._id);
                            if (e.key === "Escape") setEditingId(null);
                          }}
                          autoFocus
                        />
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-6 w-6"
                          onClick={() => handleEditLabel(asset._id)}
                        >
                          <Check className="h-3 w-3" />
                        </Button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium truncate text-[#0f0f11]">
                          {asset.label}
                        </span>
                        <div
                          className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <button
                            className="p-0.5 hover:text-[#7c3aed] text-[#6b7280]"
                            onClick={() => {
                              setEditingId(asset._id);
                              setEditLabel(asset.label);
                            }}
                          >
                            <Pencil className="h-3 w-3" />
                          </button>
                          <button
                            className="p-0.5 hover:text-red-500 text-[#6b7280]"
                            onClick={() => handleDelete(asset._id)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
