import { useState } from "react";
import { useMutation, useAction, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import { ModelSelector } from "./ModelSelector";
import { PromptEditor, type PromptSegment } from "./PromptEditor";
import { OutputControls } from "./OutputControls";
import { AssetLibraryModal } from "./AssetLibraryModal";
import { GenerationPreview } from "./GenerationPreview";
import { Gallery } from "./Gallery";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MODELS, getModel } from "@/lib/models";
import type { AspectRatio, Resolution, Duration, Generation, Asset } from "@/types";
import { Sparkles, Loader2, FlaskConical, Mail } from "lucide-react";
import { UserMenu } from "./UserMenu";
import { InviteModal } from "./InviteModal";

function Sep() {
  return <div className="border-t border-[#e5e7eb] my-4" />;
}

export function PlaygroundPage() {
  // State
  const [modelKey, setModelKey] = useState("nanobanana2");
  const [segments, setSegments] = useState<PromptSegment[]>([
    { type: "text", value: "" },
  ]);
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>("16:9");
  const [resolution, setResolution] = useState<Resolution>("standard");
  const [duration, setDuration] = useState<Duration>("5s");
  const [assetModalOpen, setAssetModalOpen] = useState(false);
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [cinematicLoading, setCinematicLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [activeGenerationId, setActiveGenerationId] = useState<Id<"generations"> | null>(null);

  const currentModel = getModel(modelKey) ?? MODELS[0]!;

  // Convex — auth is handled server-side, no userId needed on client
  const createGeneration = useMutation(api.generations.createGeneration);
  const submitGeneration = useAction(api.replicate.submitGeneration);
  const enhancePrompt = useAction(api.replicate.enhancePromptWithClaude);
  const activeGeneration = useQuery(
    api.generations.getGeneration,
    activeGenerationId ? { generationId: activeGenerationId } : "skip"
  ) as Generation | null | undefined;

  const isLive =
    activeGeneration?.status === "processing" ||
    activeGeneration?.status === "queued";

  const getPromptText = () =>
    segments.map((s) => (s.type === "token" ? `@${s.token!.label}` : s.value)).join("").trim();

  const getReferenceAssetIds = (): Id<"assets">[] =>
    segments
      .filter((s) => s.type === "token")
      .map((s) => s.token!.assetId as Id<"assets">);

  const handleCinematic = async () => {
    const text = getPromptText();
    if (!text) return;
    setCinematicLoading(true);
    try {
      const enhanced = await enhancePrompt({ prompt: text });
      setSegments([{ type: "text", value: enhanced }]);
    } catch (err) {
      console.error("Cinematic enhancement failed:", err);
      alert("Enhancement failed. Check your API configuration.");
    } finally {
      setCinematicLoading(false);
    }
  };

  const handleAssetSelect = (asset: Asset) => {
    const newToken: PromptSegment = {
      type: "token",
      value: `@${asset.label}`,
      token: { assetId: asset._id, label: asset.label },
    };
    setSegments((prev) => {
      const last = prev[prev.length - 1];
      if (last?.type === "text") {
        return [...prev.slice(0, -1), last, newToken, { type: "text", value: " " }];
      }
      return [...prev, newToken, { type: "text", value: " " }];
    });
  };

  const handleGenerate = async () => {
    const promptText = getPromptText();
    if (!promptText) {
      alert("Please enter a prompt.");
      return;
    }

    setGenerating(true);
    try {
      const genId = await createGeneration({
        modelKey,
        promptOriginal: promptText,
        promptFinal: promptText,
        referenceAssetIds: getReferenceAssetIds(),
        parameters: {
          aspectRatio,
          resolution,
          duration: currentModel.supportsDuration ? duration : undefined,
        },
        mediaType: currentModel.mediaType,
      });

      setActiveGenerationId(genId);
      setGenerating(false);

      submitGeneration({
        generationId: genId,
        modelKey,
        promptFinal: promptText,
        referenceAssetIds: getReferenceAssetIds(),
        parameters: {
          aspectRatio,
          resolution,
          duration: currentModel.supportsDuration ? duration : undefined,
        },
      }).catch(console.error);
    } catch (err) {
      console.error(err);
      alert("Failed to start generation.");
      setGenerating(false);
    }
  };

  const handleModelChange = (key: string) => {
    setModelKey(key);
    const m = getModel(key);
    if (!m) return;
    if (!m.supportedAspectRatios.includes(aspectRatio)) {
      setAspectRatio(m.supportedAspectRatios[0]!);
    }
    if (!m.supportedResolutions.includes(resolution)) {
      setResolution(m.supportedResolutions[0]!);
    }
    if (m.supportsDuration && !m.supportedDurations.includes(duration)) {
      setDuration(m.supportedDurations[0]!);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <header className="border-b border-[#e5e7eb] px-6 py-3 flex items-center justify-between sticky top-0 bg-white/95 backdrop-blur-sm z-10">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-[#7c3aed] flex items-center justify-center">
            <FlaskConical className="h-4 w-4 text-white" />
          </div>
          <span className="font-semibold text-[#0f0f11] tracking-tight">Curie Lab</span>
          <span className="text-xs text-[#9ca3af] ml-1">Private Creative Playground</span>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setInviteModalOpen(true)}
            className="gap-1.5 h-7 text-xs"
          >
            <Mail className="h-3 w-3" />
            Invite
          </Button>
          <UserMenu />
        </div>
      </header>

      <div className="flex h-[calc(100vh-53px)]">
        {/* Left Panel */}
        <aside className="w-72 border-r border-[#e5e7eb] flex flex-col">
          <ScrollArea className="flex-1">
            <div className="p-4 space-y-5">
              <ModelSelector selected={modelKey} onChange={handleModelChange} />

              <Sep />

              <PromptEditor
                segments={segments}
                onChange={setSegments}
                onCinematic={handleCinematic}
                cinematicLoading={cinematicLoading}
                supportsReferenceAssets={currentModel.supportsReferenceAssets}
                onAddReference={() => setAssetModalOpen(true)}
              />

              <Sep />

              <OutputControls
                model={currentModel}
                aspectRatio={aspectRatio}
                resolution={resolution}
                duration={duration}
                onAspectRatioChange={setAspectRatio}
                onResolutionChange={setResolution}
                onDurationChange={setDuration}
              />

              <Button
                className="w-full gap-2 mt-2"
                size="lg"
                onClick={handleGenerate}
                disabled={generating || isLive}
              >
                {generating || isLive ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    {generating ? "Starting…" : "Generating…"}
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" />
                    Generate
                  </>
                )}
              </Button>
            </div>
          </ScrollArea>
        </aside>

        {/* Right Panel */}
        <main className="flex-1 overflow-auto">
          <div className="p-6 space-y-8">
            <section>
              <h2 className="text-sm font-semibold text-[#6b7280] uppercase tracking-wider mb-4">
                Current Generation
              </h2>
              <div className="max-w-lg">
                <GenerationPreview
                  generation={activeGeneration ?? null}
                  loading={generating}
                />
              </div>
            </section>

            <section>
              <h2 className="text-sm font-semibold text-[#6b7280] uppercase tracking-wider mb-4">
                Your Gallery
              </h2>
              <Gallery
                onSelectGeneration={(gen) =>
                  setActiveGenerationId(gen._id as Id<"generations">)
                }
              />
            </section>
          </div>
        </main>
      </div>

      <AssetLibraryModal
        open={assetModalOpen}
        onClose={() => setAssetModalOpen(false)}
        onSelect={handleAssetSelect}
      />
      <InviteModal
        open={inviteModalOpen}
        onClose={() => setInviteModalOpen(false)}
      />
    </div>
  );
}
