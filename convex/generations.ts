import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const createGeneration = mutation({
  args: {
    userId: v.string(),
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
    return await ctx.db.insert("generations", {
      userId: args.userId,
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
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    const generations = await ctx.db
      .query("generations")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
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
  args: { generationId: v.id("generations"), userId: v.string() },
  handler: async (ctx, args) => {
    const gen = await ctx.db.get(args.generationId);
    if (!gen || gen.userId !== args.userId) return null;
    let outputUrl = gen.outputUrl;
    if (!outputUrl && gen.outputStorageId) {
      outputUrl = (await ctx.storage.getUrl(gen.outputStorageId)) ?? undefined;
    }
    return { ...gen, outputUrl };
  },
});

export const getPendingGenerations = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("generations")
      .withIndex("by_user_status", (q) =>
        q.eq("userId", args.userId).eq("status", "processing")
      )
      .collect();
  },
});
