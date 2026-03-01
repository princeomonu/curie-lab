import { query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

// Currently signed-in user's profile
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

// True when no users exist yet — first visitor gets to create the admin account
export const isFirstUser = query({
  args: {},
  handler: async (ctx) => {
    const first = await ctx.db.query("users").first();
    return first === null;
  },
});

// Check whether the signed-in user's email is on the invite list
export const isInvited = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return false;
    const user = await ctx.db.get(userId);
    if (!user?.email) return false;
    const invite = await ctx.db
      .query("invitedUsers")
      .withIndex("by_email", (q) => q.eq("email", user.email!))
      .first();
    return !!invite;
  },
});
