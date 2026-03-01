import { useRef } from "react";
import { Clapperboard, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ReferenceToken {
  assetId: string;
  label: string;
}

interface PromptSegment {
  type: "text" | "token";
  value: string;
  token?: ReferenceToken;
}

interface Props {
  segments: PromptSegment[];
  onChange: (segments: PromptSegment[]) => void;
  onCinematic: () => void;
  cinematicLoading: boolean;
  supportsReferenceAssets: boolean;
  onAddReference: () => void;
}

export function PromptEditor({
  segments,
  onChange,
  onCinematic,
  cinematicLoading,
  supportsReferenceAssets,
  onAddReference,
}: Props) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Derive plain text for the textarea (tokens shown as @Label)
  const toPlainText = (segs: PromptSegment[]) =>
    segs.map((s) => (s.type === "token" ? `@${s.token!.label}` : s.value)).join("");

  const handleTextChange = (value: string) => {
    const tokens = segments.filter((s) => s.type === "token");
    if (tokens.length === 0) {
      onChange([{ type: "text", value }]);
      return;
    }

    const newSegments: PromptSegment[] = [];
    let remaining = value;

    for (const token of tokens) {
      const tag = `@${token.token!.label}`;
      const idx = remaining.indexOf(tag);
      if (idx === -1) continue;
      if (idx > 0) {
        newSegments.push({ type: "text", value: remaining.slice(0, idx) });
      }
      newSegments.push(token);
      remaining = remaining.slice(idx + tag.length);
    }
    if (remaining) {
      newSegments.push({ type: "text", value: remaining });
    }

    onChange(newSegments.length ? newSegments : [{ type: "text", value }]);
  };

  const removeToken = (idx: number) => {
    onChange(segments.filter((_, i) => i !== idx));
  };

  const hasContent = segments.some(
    (s) => (s.type === "text" && s.value.trim()) || s.type === "token"
  );

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold text-[#6b7280] uppercase tracking-wider">
          Prompt
        </p>
        <div className="flex items-center gap-2">
          {supportsReferenceAssets && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onAddReference}
              className="text-xs h-7"
            >
              + Reference
            </Button>
          )}
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={onCinematic}
            disabled={!hasContent || cinematicLoading}
            className="text-xs h-7 gap-1"
            title="Enhance with Cinematic AI"
          >
            {cinematicLoading ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              <Clapperboard className="h-3 w-3" />
            )}
            Cinematic
          </Button>
        </div>
      </div>

      {/* Token chips */}
      {segments.some((s) => s.type === "token") && (
        <div className="flex flex-wrap gap-1.5">
          {segments
            .filter((s) => s.type === "token")
            .map((seg, i) => {
              const realIdx = segments.indexOf(seg);
              return (
                <span
                  key={`${seg.token!.assetId}-${i}`}
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#ede9fe] text-[#5b21b6] text-xs font-medium"
                >
                  @{seg.token!.label}
                  <button
                    type="button"
                    onClick={() => removeToken(realIdx)}
                    className="hover:text-red-500 transition-colors"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              );
            })}
        </div>
      )}

      <div className="relative">
        <textarea
          ref={textareaRef}
          value={toPlainText(segments)}
          onChange={(e) => handleTextChange(e.target.value)}
          placeholder="Describe your scene… e.g. A cinematic close-up of a woman in golden hour light"
          rows={4}
          className={cn(
            "w-full rounded-md border border-[#e5e7eb] bg-white px-3 py-2 text-sm shadow-sm",
            "placeholder:text-[#9ca3af] resize-none",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7c3aed] focus-visible:ring-offset-0"
          )}
        />
      </div>
    </div>
  );
}

export type { PromptSegment, ReferenceToken };
