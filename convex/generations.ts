import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

export const createGeneration = mutation({
  args: {
    modelKey: v.string(),
    promptOriginal: v.string(),
    promptFinal: v.string(),
    referenceAssetIds: v.array(v.id("assets")),
    parameters: v.object({
      aspectRatio: v.string(),
      resolution: v.string(),
      duration: v.optional(v.string()),
    }),
    mediaType: v.union(v.literal("image"), v.literal("video")),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Unauthenticated");
    return await ctx.db.insert("generations", {
      userId,
      modelKey: args.modelKey,
      promptOriginal: args.promptOriginal,
      promptFinal: args.promptFinal,
      referenceAssetIds: args.referenceAssetIds,
      parameters: args.parameters,
      status: "queued",
      mediaType: args.mediaType,
      createdAt: Date.now(),
    });
  },
});

export const updateGenerationPredictionId = mutation({
  args: {
    generationId: v.id("generations"),
    replicatePredictionId: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.generationId, {
      replicatePredictionId: args.replicatePredictionId,
      status: "processing",
    });
  },
});

export const completeGeneration = mutation({
  args: {
    generationId: v.id("generations"),
    outputStorageId: v.optional(v.id("_storage")),
    outputUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.generationId, {
      status: "completed",
      outputStorageId: args.outputStorageId,
      outputUrl: args.outputUrl,
      completedAt: Date.now(),
    });
  },
});

export const failGeneration = mutation({
  args: {
    generationId: v.id("generations"),
    errorMessage: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.generationId, {
      status: "failed",
      errorMessage: args.errorMessage,
    });
  },
});

export const listGenerations = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];
    const generations = await ctx.db
      .query("generations")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .order("desc")
      .take(50);

    return Promise.all(
      generations.map(async (gen) => {
        let outputUrl = gen.outputUrl;
        if (!outputUrl && gen.outputStorageId) {
          outputUrl = (await ctx.storage.getUrl(gen.outputStorageId)) ?? undefined;
        }
        return { ...gen, outputUrl };
      })
    );
  },
});

export const getGeneration = query({
  args: { generationId: v.id("generations") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;
    const gen = await ctx.db.get(args.generationId);
    if (!gen || gen.userId !== userId) return null;
    let outputUrl = gen.outputUrl;
    if (!outputUrl && gen.outputStorageId) {
      outputUrl = (await ctx.storage.getUrl(gen.outputStorageId)) ?? undefined;
    }
    return { ...gen, outputUrl };
  },
});
