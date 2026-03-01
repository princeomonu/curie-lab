import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Unauthenticated");
    return await ctx.storage.generateUploadUrl();
  },
});

export const createAsset = mutation({
  args: {
    label: v.string(),
    storageId: v.id("_storage"),
    sourceType: v.union(v.literal("upload"), v.literal("generated")),
    mimeType: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Unauthenticated");
    return await ctx.db.insert("assets", {
      userId,
      label: args.label,
      storageId: args.storageId,
      sourceType: args.sourceType,
      mimeType: args.mimeType,
      createdAt: Date.now(),
    });
  },
});

export const updateAssetLabel = mutation({
  args: {
    assetId: v.id("assets"),
    label: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Unauthenticated");
    const asset = await ctx.db.get(args.assetId);
    if (!asset || asset.userId !== userId) {
      throw new Error("Asset not found or unauthorized");
    }
    await ctx.db.patch(args.assetId, { label: args.label });
  },
});

export const deleteAsset = mutation({
  args: {
    assetId: v.id("assets"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Unauthenticated");
    const asset = await ctx.db.get(args.assetId);
    if (!asset || asset.userId !== userId) {
      throw new Error("Asset not found or unauthorized");
    }
    await ctx.storage.delete(asset.storageId);
    await ctx.db.delete(args.assetId);
  },
});

export const listAssets = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];
    const assets = await ctx.db
      .query("assets")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .order("desc")
      .collect();

    return Promise.all(
      assets.map(async (asset) => ({
        ...asset,
        url: await ctx.storage.getUrl(asset.storageId),
      }))
    );
  },
});

export const getAsset = query({
  args: { assetId: v.id("assets") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;
    const asset = await ctx.db.get(args.assetId);
    if (!asset || asset.userId !== userId) return null;
    return {
      ...asset,
      url: await ctx.storage.getUrl(asset.storageId),
    };
  },
});
