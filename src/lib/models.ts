import type { ModelInfo } from "@/types";

export const MODELS: ModelInfo[] = [
  {
    key: "nanobanana2",
    name: "NanoBanana 2",
    mediaType: "image",
    supportsReferenceAssets: false,
    supportsDuration: false,
    supportedAspectRatios: ["1:1", "4:5", "16:9", "9:16"],
    supportedResolutions: ["standard", "high"],
    supportedDurations: [],
  },
  {
    key: "nanobanana_pro",
    name: "NanoBanana Pro",
    mediaType: "image",
    supportsReferenceAssets: true,
    supportsDuration: false,
    supportedAspectRatios: ["1:1", "4:5", "16:9", "9:16"],
    supportedResolutions: ["standard", "high", "ultra"],
    supportedDurations: [],
  },
  {
    key: "gpt_image_15",
    name: "GPT Image 1.5",
    mediaType: "image",
    supportsReferenceAssets: true,
    supportsDuration: false,
    supportedAspectRatios: ["1:1", "4:5", "16:9", "9:16"],
    supportedResolutions: ["standard", "high", "ultra"],
    supportedDurations: [],
  },
  {
    key: "kling30",
    name: "Kling 3.0",
    mediaType: "video",
    supportsReferenceAssets: true,
    supportsDuration: true,
    supportedAspectRatios: ["1:1", "16:9", "9:16"],
    supportedResolutions: ["standard", "high"],
    supportedDurations: ["3s", "5s"],
  },
  {
    key: "kling30_omni",
    name: "Kling 3.0 Omni",
    mediaType: "video",
    supportsReferenceAssets: true,
    supportsDuration: true,
    supportedAspectRatios: ["1:1", "16:9", "9:16"],
    supportedResolutions: ["standard", "high"],
    supportedDurations: ["3s", "5s", "8s"],
  },
];

export function getModel(key: string): ModelInfo | undefined {
  return MODELS.find((m) => m.key === key);
}

export const ASPECT_RATIO_LABELS: Record<string, string> = {
  "1:1": "Square (1:1)",
  "4:5": "Portrait (4:5)",
  "16:9": "Landscape (16:9)",
  "9:16": "Vertical (9:16)",
};

export const RESOLUTION_LABELS: Record<string, string> = {
  standard: "Standard",
  high: "High",
  ultra: "Ultra",
};

export const DURATION_LABELS: Record<string, string> = {
  "3s": "3 seconds",
  "5s": "5 seconds",
  "8s": "8 seconds",
};
