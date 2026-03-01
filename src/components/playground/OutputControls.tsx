import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import {
  ASPECT_RATIO_LABELS,
  RESOLUTION_LABELS,
  DURATION_LABELS,
} from "@/lib/models";
import type { ModelInfo, AspectRatio, Resolution, Duration } from "@/types";

interface Props {
  model: ModelInfo;
  aspectRatio: AspectRatio;
  resolution: Resolution;
  duration: Duration;
  onAspectRatioChange: (v: AspectRatio) => void;
  onResolutionChange: (v: Resolution) => void;
  onDurationChange: (v: Duration) => void;
}

export function OutputControls({
  model,
  aspectRatio,
  resolution,
  duration,
  onAspectRatioChange,
  onResolutionChange,
  onDurationChange,
}: Props) {
  return (
    <div className="space-y-3">
      <p className="text-xs font-semibold text-[#6b7280] uppercase tracking-wider">
        Output Controls
      </p>

      <div className="space-y-2">
        <Label className="text-xs text-[#6b7280]">Aspect Ratio</Label>
        <Select
          value={aspectRatio}
          onValueChange={(v) => onAspectRatioChange(v as AspectRatio)}
        >
          <SelectTrigger className="h-8 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {model.supportedAspectRatios.map((ar) => (
              <SelectItem key={ar} value={ar} className="text-xs">
                {ASPECT_RATIO_LABELS[ar]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label className="text-xs text-[#6b7280]">Resolution</Label>
        <Select
          value={resolution}
          onValueChange={(v) => onResolutionChange(v as Resolution)}
        >
          <SelectTrigger className="h-8 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {model.supportedResolutions.map((r) => (
              <SelectItem key={r} value={r} className="text-xs">
                {RESOLUTION_LABELS[r]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {model.supportsDuration && (
        <div className="space-y-2">
          <Label className="text-xs text-[#6b7280]">Duration</Label>
          <Select
            value={duration}
            onValueChange={(v) => onDurationChange(v as Duration)}
          >
            <SelectTrigger className="h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {model.supportedDurations.map((d) => (
                <SelectItem key={d} value={d} className="text-xs">
                  {DURATION_LABELS[d]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
    </div>
  );
}
