import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Sync user from Clerk JWT
export const upsertUser = mutation({
  args: {
    clerkId: v.string(),
    email: v.string(),
    name: v.optional(v.string()),
    imageUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        name: args.name,
        imageUrl: args.imageUrl,
      });
      return existing._id;
    }

    return await ctx.db.insert("users", {
      clerkId: args.clerkId,
      email: args.email,
      name: args.name,
      imageUrl: args.imageUrl,
      createdAt: Date.now(),
    });
  },
});

export const isInvited = query({
  args: { email: v.string() },
  handler: async (ctx, args) => {
    const invited = await ctx.db
      .query("invitedUsers")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .first();
    return !!invited;
  },
});

export const addInvite = mutation({
  args: { email: v.string() },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("invitedUsers")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .first();
    if (existing) return existing._id;
    return await ctx.db.insert("invitedUsers", {
      email: args.email,
      invitedAt: Date.now(),
    });
  },
});
