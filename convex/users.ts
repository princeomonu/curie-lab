import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

export const viewer = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;
    const user = await ctx.db.get(userId);
    if (!user) return null;
    return {
      _id: user._id,
      email: user.email ?? "",
      name: user.name,
      image: user.image,
    };
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
