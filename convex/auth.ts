import { convexAuth, getAuthUserId } from "@convex-dev/auth/server";
import { Password } from "@convex-dev/auth/providers/Password";

export const { auth, signIn, signOut, store, isAuthenticated } = convexAuth({
  providers: [Password],
  callbacks: {
    // Automatically whitelist the very first user who signs up (admin)
    async afterUserCreatedOrUpdated(ctx, args) {
      // Only act on new user creation, not updates
      if (args.existingUserId !== undefined) return;

      const user = await ctx.db.get(args.userId);
      if (!user?.email) return;

      // Check if this is the first user in the system
      const users = await ctx.db.query("users").take(2);
      if (users.length <= 1) {
        const existing = await ctx.db
          .query("invitedUsers")
          .withIndex("by_email", (q) => q.eq("email", user.email!))
          .first();
        if (!existing) {
          await ctx.db.insert("invitedUsers", {
            email: user.email,
            invitedAt: Date.now(),
          });
        }
      }
    },
  },
});

export { getAuthUserId };
