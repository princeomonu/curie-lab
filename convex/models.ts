// Model abstraction layer — all Replicate model definitions

export type AspectRatio = "1:1" | "4:5" | "16:9" | "9:16";
export type Resolution = "standard" | "high" | "ultra";
export type Duration = "3s" | "5s" | "8s";
export type MediaType = "image" | "video";

export interface UserInput {
  prompt: string;
  aspectRatio: AspectRatio;
  resolution: Resolution;
  duration?: Duration;
  referenceUrls?: string[];
}

export interface ModelDefinition {
  key: string;
  name: string;
  replicateId: string;
  mediaType: MediaType;
  supportsReferenceAssets: boolean;
  supportsDuration: boolean;
  supportedAspectRatios: AspectRatio[];
  supportedResolutions: Resolution[];
  supportedDurations?: Duration[];
  inputBuilder: (input: UserInput) => Record<string, unknown>;
}

// --- Resolution helpers ---

function imageResolutionMap(
  aspectRatio: AspectRatio,
  resolution: Resolution
): { width: number; height: number } {
  const base: Record<AspectRatio, [number, number]> = {
    "1:1": [1024, 1024],
    "4:5": [896, 1120],
    "16:9": [1344, 756],
    "9:16": [756, 1344],
  };

  const multipliers: Record<Resolution, number> = {
    standard: 1,
    high: 1.25,
    ultra: 1.5,
  };

  const [w, h] = base[aspectRatio];
  const m = multipliers[resolution];

  return {
    width: Math.round((w * m) / 64) * 64,
    height: Math.round((h * m) / 64) * 64,
  };
}

function durationSeconds(d: Duration): number {
  return parseInt(d.replace("s", ""), 10);
}

// --- Model Definitions ---

export const MODELS: Record<string, ModelDefinition> = {
  nanobanana2: {
    key: "nanobanana2",
    name: "NanoBanana 2",
    replicateId: "black-forest-labs/flux-1.1-pro",
    mediaType: "image",
    supportsReferenceAssets: false,
    supportsDuration: false,
    supportedAspectRatios: ["1:1", "4:5", "16:9", "9:16"],
    supportedResolutions: ["standard", "high"],
    inputBuilder: (input) => {
      const { width, height } = imageResolutionMap(
        input.aspectRatio,
        input.resolution
      );
      return {
        prompt: input.prompt,
        width,
        height,
        output_format: "webp",
        output_quality: 90,
        safety_tolerance: 2,
      };
    },
  },

  nanobanana_pro: {
    key: "nanobanana_pro",
    name: "NanoBanana Pro",
    replicateId: "black-forest-labs/flux-1.1-pro-ultra",
    mediaType: "image",
    supportsReferenceAssets: true,
    supportsDuration: false,
    supportedAspectRatios: ["1:1", "4:5", "16:9", "9:16"],
    supportedResolutions: ["standard", "high", "ultra"],
    inputBuilder: (input) => {
      const aspectMap: Record<AspectRatio, string> = {
        "1:1": "1:1",
        "4:5": "4:5",
        "16:9": "16:9",
        "9:16": "9:16",
      };
      const resMap: Record<Resolution, number> = {
        standard: 1,
        high: 2,
        ultra: 4,
      };
      const payload: Record<string, unknown> = {
        prompt: input.prompt,
        aspect_ratio: aspectMap[input.aspectRatio],
        output_format: "webp",
        output_quality: 90,
        raw: resMap[input.resolution] >= 2,
      };
      if (input.referenceUrls?.length) {
        payload.image_prompt = input.referenceUrls[0];
        payload.image_prompt_strength = 0.1;
      }
      return payload;
    },
  },

  gpt_image_15: {
    key: "gpt_image_15",
    name: "GPT Image 1.5",
    replicateId: "openai/gpt-image-1",
    mediaType: "image",
    supportsReferenceAssets: true,
    supportsDuration: false,
    supportedAspectRatios: ["1:1", "4:5", "16:9", "9:16"],
    supportedResolutions: ["standard", "high", "ultra"],
    inputBuilder: (input) => {
      const sizeMap: Record<AspectRatio, Record<Resolution, string>> = {
        "1:1": { standard: "1024x1024", high: "1024x1024", ultra: "1024x1024" },
        "4:5": { standard: "1024x1792", high: "1024x1792", ultra: "1024x1792" },
        "16:9": { standard: "1792x1024", high: "1792x1024", ultra: "1792x1024" },
        "9:16": { standard: "1024x1792", high: "1024x1792", ultra: "1024x1792" },
      };
      const payload: Record<string, unknown> = {
        prompt: input.prompt,
        size: sizeMap[input.aspectRatio][input.resolution],
        quality: input.resolution === "standard" ? "standard" : "hd",
        n: 1,
      };
      if (input.referenceUrls?.length) {
        payload.image = input.referenceUrls[0];
      }
      return payload;
    },
  },

  kling30: {
    key: "kling30",
    name: "Kling 3.0",
    replicateId: "kwaivgi/kling-v1-5-pro",
    mediaType: "video",
    supportsReferenceAssets: true,
    supportsDuration: true,
    supportedAspectRatios: ["1:1", "16:9", "9:16"],
    supportedResolutions: ["standard", "high"],
    supportedDurations: ["3s", "5s"],
    inputBuilder: (input) => {
      const aspectMap: Record<AspectRatio, string> = {
        "1:1": "1:1",
        "4:5": "9:16",
        "16:9": "16:9",
        "9:16": "9:16",
      };
      const payload: Record<string, unknown> = {
        prompt: input.prompt,
        aspect_ratio: aspectMap[input.aspectRatio],
        duration: input.duration ? durationSeconds(input.duration) : 5,
        cfg_scale: 0.5,
      };
      if (input.referenceUrls?.length) {
        payload.start_image = input.referenceUrls[0];
      }
      return payload;
    },
  },

  kling30_omni: {
    key: "kling30_omni",
    name: "Kling 3.0 Omni",
    replicateId: "kwaivgi/kling-v2-master",
    mediaType: "video",
    supportsReferenceAssets: true,
    supportsDuration: true,
    supportedAspectRatios: ["1:1", "16:9", "9:16"],
    supportedResolutions: ["standard", "high"],
    supportedDurations: ["3s", "5s", "8s"],
    inputBuilder: (input) => {
      const aspectMap: Record<AspectRatio, string> = {
        "1:1": "1:1",
        "4:5": "9:16",
        "16:9": "16:9",
        "9:16": "9:16",
      };
      const payload: Record<string, unknown> = {
        prompt: input.prompt,
        aspect_ratio: aspectMap[input.aspectRatio],
        duration: input.duration ? durationSeconds(input.duration) : 5,
        cfg_scale: 0.5,
      };
      if (input.referenceUrls?.length) {
        payload.start_image = input.referenceUrls[0];
      }
      return payload;
    },
  },
};

export function getModel(key: string): ModelDefinition {
  const model = MODELS[key];
  if (!model) throw new Error(`Unknown model: ${key}`);
  return model;
}

export function buildModelInput(
  modelKey: string,
  userInput: UserInput
): Record<string, unknown> {
  const model = getModel(modelKey);
  return model.inputBuilder(userInput);
}
