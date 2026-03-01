import { v } from "convex/values";
import { action } from "./_generated/server";
import { api } from "./_generated/api";
import { buildModelInput, getModel } from "./models";
import type { AspectRatio, Resolution, Duration, UserInput } from "./models";

const REPLICATE_API = "https://api.replicate.com/v1";

async function replicateRequest(
  path: string,
  method: "GET" | "POST",
  body?: unknown
) {
  const apiKey = process.env.REPLICATE_API_KEY;
  if (!apiKey) throw new Error("REPLICATE_API_KEY not configured");

  const res = await fetch(`${REPLICATE_API}${path}`, {
    method,
    headers: {
      Authorization: `Token ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Replicate API error ${res.status}: ${text}`);
  }

  return res.json();
}

export const enhancePromptWithClaude = action({
  args: {
    prompt: v.string(),
  },
  handler: async (_ctx, args) => {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) throw new Error("ANTHROPIC_API_KEY not configured");

    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-6",
        max_tokens: 512,
        system:
          "You are a cinematic prompt engineer. Rewrite the user's prompt into a direct, cinematic, production-ready visual prompt. Preserve the subject and intent. Return ONLY the enhanced prompt — no preamble, no explanation, no quotes.",
        messages: [{ role: "user", content: args.prompt }],
      }),
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Claude API error ${res.status}: ${text}`);
    }

    const data = await res.json();
    return (data.content[0] as { text: string }).text.trim();
  },
});

export const submitGeneration = action({
  args: {
    generationId: v.id("generations"),
    userId: v.string(),
    modelKey: v.string(),
    promptFinal: v.string(),
    referenceAssetIds: v.array(v.id("assets")),
    parameters: v.object({
      aspectRatio: v.string(),
      resolution: v.string(),
      duration: v.optional(v.string()),
    }),
  },
  handler: async (ctx, args) => {
    const model = getModel(args.modelKey);

    // Resolve reference asset URLs
    const referenceUrls: string[] = [];
    for (const assetId of args.referenceAssetIds) {
      const asset: { url: string | null } | null = await ctx.runQuery(
        api.assets.getAsset,
        { assetId, userId: args.userId }
      );
      if (asset?.url) referenceUrls.push(asset.url);
    }

    const userInput: UserInput = {
      prompt: args.promptFinal,
      aspectRatio: args.parameters.aspectRatio as AspectRatio,
      resolution: args.parameters.resolution as Resolution,
      duration: args.parameters.duration as Duration | undefined,
      referenceUrls,
    };

    const modelInput = buildModelInput(args.modelKey, userInput);

    // Create Replicate prediction
    const prediction = await replicateRequest("/predictions", "POST", {
      version: model.replicateId,
      input: modelInput,
    });

    // Update generation with prediction ID
    await ctx.runMutation(api.generations.updateGenerationPredictionId, {
      generationId: args.generationId,
      replicatePredictionId: prediction.id,
    });

    // Poll for completion
    await pollPrediction(ctx, args.generationId, prediction.id, model.mediaType);
  },
});

async function pollPrediction(
  ctx: Parameters<Parameters<typeof submitGeneration["handler"]>[0]>[0],
  generationId: Parameters<typeof submitGeneration["handler"]>[1]["generationId"],
  predictionId: string,
  mediaType: "image" | "video"
) {
  const maxAttempts = 120; // 10 minutes at 5s intervals
  let attempts = 0;

  while (attempts < maxAttempts) {
    await new Promise((r) => setTimeout(r, 5000));
    attempts++;

    const prediction = await replicateRequest(
      `/predictions/${predictionId}`,
      "GET"
    );

    if (prediction.status === "succeeded") {
      const outputUrl: string = Array.isArray(prediction.output)
        ? prediction.output[0]
        : prediction.output;

      // Download and store in Convex Storage
      try {
        const fileRes = await fetch(outputUrl);
        const blob = await fileRes.blob();
        const mimeType = mediaType === "video" ? "video/mp4" : "image/webp";

        const uploadUrl: string = await ctx.runMutation(
          api.assets.generateUploadUrl,
          {}
        );

        const uploadRes = await fetch(uploadUrl, {
          method: "POST",
          headers: { "Content-Type": mimeType },
          body: blob,
        });

        if (!uploadRes.ok) throw new Error("Upload failed");

        const { storageId } = await uploadRes.json();

        await ctx.runMutation(api.generations.completeGeneration, {
          generationId,
          outputStorageId: storageId,
        });
      } catch {
        // Fallback: store only the URL
        await ctx.runMutation(api.generations.completeGeneration, {
          generationId,
          outputUrl,
        });
      }
      return;
    }

    if (prediction.status === "failed" || prediction.status === "canceled") {
      await ctx.runMutation(api.generations.failGeneration, {
        generationId,
        errorMessage: prediction.error ?? "Generation failed",
      });
      return;
    }
  }

  await ctx.runMutation(api.generations.failGeneration, {
    generationId,
    errorMessage: "Generation timed out",
  });
}
