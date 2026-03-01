import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // Whitelisted users
  invitedUsers: defineTable({
    email: v.string(),
    invitedAt: v.number(),
  }).index("by_email", ["email"]),

  // User sessions/profiles
  users: defineTable({
    clerkId: v.string(),
    email: v.string(),
    name: v.optional(v.string()),
    imageUrl: v.optional(v.string()),
    createdAt: v.number(),
  }).index("by_clerk_id", ["clerkId"]),

  // Reusable reference assets
  assets: defineTable({
    userId: v.string(),
    label: v.string(),
    storageId: v.id("_storage"),
    sourceType: v.union(v.literal("upload"), v.literal("generated")),
    mimeType: v.optional(v.string()),
    thumbnailStorageId: v.optional(v.id("_storage")),
    createdAt: v.number(),
  }).index("by_user", ["userId"]),

  // Generation records
  generations: defineTable({
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
