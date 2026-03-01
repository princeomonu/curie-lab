import { MODELS } from "@/lib/models";
import type { ModelInfo } from "@/types";
import { cn } from "@/lib/utils";
import { Film, ImageIcon } from "lucide-react";

interface Props {
  selected: string;
  onChange: (key: string) => void;
}

export function ModelSelector({ selected, onChange }: Props) {
  const imageModels = MODELS.filter((m) => m.mediaType === "image");
  const videoModels = MODELS.filter((m) => m.mediaType === "video");

  return (
    <div className="space-y-3">
      <p className="text-xs font-semibold text-[#6b7280] uppercase tracking-wider">
        Model
      </p>
      <div className="space-y-2">
        <p className="text-xs text-[#9ca3af] flex items-center gap-1">
          <ImageIcon className="h-3 w-3" /> Image
        </p>
        <div className="grid grid-cols-1 gap-1.5">
          {imageModels.map((model) => (
            <ModelCard
              key={model.key}
              model={model}
              selected={selected === model.key}
              onSelect={onChange}
            />
          ))}
        </div>
        <p className="text-xs text-[#9ca3af] flex items-center gap-1 pt-1">
          <Film className="h-3 w-3" /> Video
        </p>
        <div className="grid grid-cols-1 gap-1.5">
          {videoModels.map((model) => (
            <ModelCard
              key={model.key}
              model={model}
              selected={selected === model.key}
              onSelect={onChange}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function ModelCard({
  model,
  selected,
  onSelect,
}: {
  model: ModelInfo;
  selected: boolean;
  onSelect: (key: string) => void;
}) {
  return (
    <button
      onClick={() => onSelect(model.key)}
      className={cn(
        "w-full text-left rounded-lg border px-3 py-2 text-sm transition-all",
        selected
          ? "border-[#7c3aed] bg-[#f4f0ff] text-[#5b21b6] font-medium"
          : "border-[#e5e7eb] bg-white text-[#0f0f11] hover:border-[#7c3aed]/40 hover:bg-[#faf9ff]"
      )}
    >
      <span className="block">{model.name}</span>
      <span className="text-xs text-[#9ca3af] capitalize">
        {model.mediaType}
        {model.supportsReferenceAssets ? " · refs" : ""}
        {model.supportsDuration ? " · duration" : ""}
      </span>
    </button>
  );
}
