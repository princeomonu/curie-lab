import { v } from "convex/values";
import { action, mutation, query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import { api } from "./_generated/api";

const INVITE_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

// ── Queries ────────────────────────────────────────────────────────────────

export const validateToken = query({
  args: { token: v.string() },
  handler: async (ctx, args) => {
    const invite = await ctx.db
      .query("invitedUsers")
      .withIndex("by_token", (q) => q.eq("token", args.token))
      .first();

    if (!invite) return null;
    if (invite.usedAt) return null; // already used
    if (invite.expiresAt && invite.expiresAt < Date.now()) return null; // expired

    return { email: invite.email };
  },
});

export const listInvites = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];
    return await ctx.db.query("invitedUsers").order("desc").collect();
  },
});

// ── Mutations ──────────────────────────────────────────────────────────────

export const acceptInvite = mutation({
  args: { token: v.string() },
  handler: async (ctx, args) => {
    const invite = await ctx.db
      .query("invitedUsers")
      .withIndex("by_token", (q) => q.eq("token", args.token))
      .first();

    if (!invite || invite.usedAt) return;
    await ctx.db.patch(invite._id, { usedAt: Date.now() });
  },
});

// ── Actions ────────────────────────────────────────────────────────────────

export const sendInvite = action({
  args: { email: v.string() },
  handler: async (ctx, args): Promise<{ success: true } | { error: string }> => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return { error: "Unauthenticated" };

    const email = args.email.trim().toLowerCase();

    // Check if already invited or a user
    const existing: { email: string; usedAt?: number } | null =
      await ctx.runQuery(api.invites.getInviteByEmail, { email });

    if (existing?.usedAt) {
      return { error: "This email already has an account." };
    }

    const token = crypto.randomUUID();
    const expiresAt = Date.now() + INVITE_TTL_MS;
    const siteUrl = process.env.SITE_URL ?? "http://localhost:5173";
    const inviteUrl = `${siteUrl}?invite=${token}`;

    // Upsert invite record
    await ctx.runMutation(api.invites.upsertInvite, {
      email,
      token,
      expiresAt,
      invitedBy: userId,
    });

    // Send via Resend
    const resendKey = process.env.RESEND_KEY;
    if (!resendKey) return { error: "RESEND_KEY not configured" };

    const fromEmail =
      process.env.RESEND_FROM_EMAIL ?? "Curie Lab <onboarding@resend.dev>";

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: fromEmail,
        to: [email],
        subject: "You're invited to Curie Lab",
        html: buildInviteEmail(inviteUrl),
      }),
    });

    if (!res.ok) {
      const text = await res.text();
      console.error("Resend error:", text);
      return { error: "Failed to send invite email. Check RESEND_KEY." };
    }

    return { success: true };
  },
});

// Internal helpers exposed as queries/mutations for runQuery/runMutation

export const getInviteByEmail = query({
  args: { email: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("invitedUsers")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .first();
  },
});

export const upsertInvite = mutation({
  args: {
    email: v.string(),
    token: v.string(),
    expiresAt: v.number(),
    invitedBy: v.id("users"),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("invitedUsers")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .first();

    if (existing) {
      // Refresh token
      await ctx.db.patch(existing._id, {
        token: args.token,
        expiresAt: args.expiresAt,
        invitedBy: args.invitedBy,
        invitedAt: Date.now(),
        usedAt: undefined,
      });
    } else {
      await ctx.db.insert("invitedUsers", {
        email: args.email,
        token: args.token,
        expiresAt: args.expiresAt,
        invitedBy: args.invitedBy,
        invitedAt: Date.now(),
      });
    }
  },
});

function buildInviteEmail(inviteUrl: string): string {
  return `
<!DOCTYPE html>
<html>
<body style="font-family: system-ui, sans-serif; background: #fafafa; padding: 40px 0; margin: 0;">
  <div style="max-width: 480px; margin: 0 auto; background: white; border-radius: 12px; border: 1px solid #e5e7eb; overflow: hidden;">
    <div style="background: #7c3aed; padding: 32px 40px;">
      <p style="color: white; font-size: 20px; font-weight: 700; margin: 0; letter-spacing: -0.3px;">
        🧪 Curie Lab
      </p>
    </div>
    <div style="padding: 32px 40px;">
      <h1 style="font-size: 22px; font-weight: 700; color: #0f0f11; margin: 0 0 12px;">
        You're invited!
      </h1>
      <p style="color: #6b7280; font-size: 15px; line-height: 1.6; margin: 0 0 28px;">
        You've been invited to join <strong>Curie Lab</strong> — a private AI creative playground
        for generating cinematic images and videos.
      </p>
      <a href="${inviteUrl}"
         style="display: inline-block; background: #7c3aed; color: white; text-decoration: none;
                font-weight: 600; font-size: 14px; padding: 12px 24px; border-radius: 8px;">
        Accept Invite &rarr;
      </a>
      <p style="color: #9ca3af; font-size: 12px; margin: 24px 0 0; line-height: 1.5;">
        This invite link expires in 7 days. If you didn't expect this email, you can ignore it.
      </p>
    </div>
  </div>
</body>
</html>`;
}
