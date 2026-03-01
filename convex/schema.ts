import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { authTables } from "@convex-dev/auth/server";

export default defineSchema({
  ...authTables,

  // Whitelisted emails
  invitedUsers: defineTable({
    email: v.string(),
    invitedAt: v.number(),
  }).index("by_email", ["email"]),

  // Reusable reference assets
  assets: defineTable({
    userId: v.id("users"),
    label: v.string(),
    storageId: v.id("_storage"),
    sourceType: v.union(v.literal("upload"), v.literal("generated")),
    mimeType: v.optional(v.string()),
    createdAt: v.number(),
  }).index("by_user", ["userId"]),

  // Generation records
  generations: defineTable({
    userId: v.id("users"),
    modelKey: v.string(),
    promptOriginal: v.string(),
    promptFinal: v.string(),
    referenceAssetIds: v.array(v.id("assets")),
    parameters: v.object({
      aspectRatio: v.string(),
      resolution: v.string(),
      duration: v.optional(v.string()),
    }),
    replicatePredictionId: v.optional(v.string()),
    status: v.union(
      v.literal("queued"),
      v.literal("processing"),
      v.literal("completed"),
      v.literal("failed")
    ),
    outputStorageId: v.optional(v.id("_storage")),
    outputUrl: v.optional(v.string()),
    errorMessage: v.optional(v.string()),
    mediaType: v.union(v.literal("image"), v.literal("video")),
    createdAt: v.number(),
    completedAt: v.optional(v.number()),
  })
    .index("by_user", ["userId"])
    .index("by_user_status", ["userId", "status"])
    .index("by_prediction", ["replicatePredictionId"]),
});
