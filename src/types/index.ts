export type AspectRatio = "1:1" | "4:5" | "16:9" | "9:16";
export type Resolution = "standard" | "high" | "ultra";
export type Duration = "3s" | "5s" | "8s";
export type MediaType = "image" | "video";
export type GenerationStatus = "queued" | "processing" | "completed" | "failed";

export interface ModelInfo {
  key: string;
  name: string;
  mediaType: MediaType;
  supportsReferenceAssets: boolean;
  supportsDuration: boolean;
  supportedAspectRatios: AspectRatio[];
  supportedResolutions: Resolution[];
  supportedDurations: Duration[];
}

export interface ReferenceToken {
  assetId: string;
  label: string;
}

export interface Generation {
  _id: string;
  userId: string;
  modelKey: string;
  promptOriginal: string;
  promptFinal: string;
  referenceAssetIds: string[];
  parameters: {
    aspectRatio: string;
    resolution: string;
    duration?: string;
  };
  status: GenerationStatus;
  outputUrl?: string;
  errorMessage?: string;
  mediaType: MediaType;
  createdAt: number;
  completedAt?: number;
}

export interface Asset {
  _id: string;
  userId: string;
  label: string;
  storageId: string;
  sourceType: "upload" | "generated";
  url: string | null;
  createdAt: number;
}
