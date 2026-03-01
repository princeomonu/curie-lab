import { useState } from "react";
import { useAuthActions } from "@convex-dev/auth/react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { FlaskConical, Loader2, Eye, EyeOff, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

// Read ?invite=TOKEN from the URL
function getInviteToken(): string | null {
  return new URLSearchParams(window.location.search).get("invite");
}

function removeTokenFromUrl() {
  const url = new URL(window.location.href);
  url.searchParams.delete("invite");
  window.history.replaceState({}, "", url.toString());
}

// ── Sub-components ────────────────────────────────────────────────────────

function Logo() {
  return (
    <div className="flex flex-col items-center gap-3 mb-8">
      <div className="w-14 h-14 rounded-2xl bg-[#7c3aed] flex items-center justify-center shadow-lg shadow-purple-200">
        <FlaskConical className="h-8 w-8 text-white" />
      </div>
      <div className="text-center">
        <h1 className="text-2xl font-bold text-[#0f0f11] tracking-tight">
          Curie Lab
        </h1>
        <p className="text-sm text-[#6b7280] mt-1">
          Invite-Only AI Creative Playground
        </p>
      </div>
    </div>
  );
}

interface AuthFormProps {
  mode: "signIn" | "signUp";
  lockedEmail?: string; // pre-filled and locked for invite flow
  heading: string;
  subheading: string;
  onSuccess?: () => void;
}

function AuthForm({ mode, lockedEmail, heading, subheading, onSuccess }: AuthFormProps) {
  const { signIn } = useAuthActions();
  const [email, setEmail] = useState(lockedEmail ?? "");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await signIn("password", { email, password, flow: mode });
      onSuccess?.();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : mode === "signIn"
          ? "Invalid email or password."
          : "Could not create account."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-sm bg-white rounded-2xl border border-[#e5e7eb] shadow-xl p-6">
      <h2 className="text-lg font-semibold text-[#0f0f11] mb-1">{heading}</h2>
      <p className="text-sm text-[#6b7280] mb-5">{subheading}</p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="email" className="text-xs text-[#374151]">
            Email
          </Label>
          <Input
            id="email"
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={!!lockedEmail}
            autoComplete="email"
            className={lockedEmail ? "bg-[#f8f8f8] text-[#6b7280]" : ""}
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="password" className="text-xs text-[#374151]">
            Password
          </Label>
          <div className="relative">
            <Input
              id="password"
              type={showPw ? "text" : "password"}
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={mode === "signUp" ? 8 : undefined}
              autoComplete={mode === "signIn" ? "current-password" : "new-password"}
              className="pr-9"
            />
            <button
              type="button"
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#9ca3af] hover:text-[#6b7280]"
              onClick={() => setShowPw((v) => !v)}
              tabIndex={-1}
            >
              {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {mode === "signUp" && (
            <p className="text-[11px] text-[#9ca3af]">Minimum 8 characters</p>
          )}
        </div>

        {error && (
          <p className="text-xs text-red-600 bg-red-50 border border-red-100 rounded-md px-3 py-2">
            {error}
          </p>
        )}

        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : mode === "signIn" ? (
            "Sign In"
          ) : (
            "Create Account"
          )}
        </Button>
      </form>
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────

export function LoginPage() {
  const token = getInviteToken();

  // Is the invite token valid?
  const inviteData = useQuery(
    api.invites.validateToken,
    token ? { token } : "skip"
  );

  // Is this the very first user?
  const isFirstUser = useQuery(api.users.isFirstUser);

  const acceptInvite = useMutation(api.invites.acceptInvite);

  const handleInviteSignupSuccess = () => {
    if (token) {
      void acceptInvite({ token });
      removeTokenFromUrl();
    }
  };

  // ── Loading states ──────────────────────────────────────────────────────

  const waitingForToken = token && inviteData === undefined;
  const waitingForFirstUser = !token && isFirstUser === undefined;

  if (waitingForToken || waitingForFirstUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-white via-[#faf9ff] to-[#f4f0ff]">
        <Loader2 className="h-6 w-6 animate-spin text-[#7c3aed]" />
      </div>
    );
  }

  // ── Render ──────────────────────────────────────────────────────────────

  const bg = "min-h-screen bg-gradient-to-br from-white via-[#faf9ff] to-[#f4f0ff] flex flex-col items-center justify-center p-4";

  // Case 1: valid invite token → signup locked to invited email
  if (token && inviteData) {
    return (
      <div className={bg}>
        <Logo />
        <div className="w-full max-w-sm mb-3">
          <div className="flex items-center gap-2 text-xs text-[#7c3aed] bg-[#f4f0ff] border border-[#7c3aed]/20 rounded-lg px-3 py-2">
            <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
            Invite accepted for <strong>{inviteData.email}</strong>
          </div>
        </div>
        <AuthForm
          mode="signUp"
          lockedEmail={inviteData.email}
          heading="Create your account"
          subheading="Set a password to complete your registration."
          onSuccess={handleInviteSignupSuccess}
        />
      </div>
    );
  }

  // Case 2: invalid / expired / used token
  if (token && !inviteData) {
    return (
      <div className={bg}>
        <Logo />
        <div className="w-full max-w-sm bg-white rounded-2xl border border-[#e5e7eb] shadow-xl p-6 text-center">
          <p className="text-sm font-medium text-red-600 mb-1">Invalid invite link</p>
          <p className="text-xs text-[#6b7280]">
            This invite link is expired, already used, or invalid.
            Please ask for a new one.
          </p>
          <Button
            variant="outline"
            size="sm"
            className="mt-4"
            onClick={() => {
              removeTokenFromUrl();
              window.location.reload();
            }}
          >
            Back to sign in
          </Button>
        </div>
      </div>
    );
  }

  // Case 3: first user — show signup to create the admin account
  if (isFirstUser) {
    return (
      <div className={bg}>
        <Logo />
        <div className="w-full max-w-sm mb-3">
          <div className="text-xs text-[#6b7280] bg-[#f8f8f8] border border-[#e5e7eb] rounded-lg px-3 py-2 text-center">
            No accounts yet — you'll be the <strong>admin</strong>.
          </div>
        </div>
        <AuthForm
          mode="signUp"
          heading="Create your admin account"
          subheading="You're the first here. Set up your credentials."
        />
      </div>
    );
  }

  // Case 4: normal sign-in
  return (
    <div className={bg}>
      <Logo />
      <AuthForm
        mode="signIn"
        heading="Sign in"
        subheading="Welcome back to Curie Lab."
      />
      <p className="mt-5 text-xs text-[#9ca3af] text-center max-w-xs">
        Don't have access? Ask an existing member to invite you.
      </p>
    </div>
  );
}
