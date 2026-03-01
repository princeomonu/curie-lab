import { SignIn } from "@clerk/clerk-react";
import { FlaskConical } from "lucide-react";

export function LoginPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-[#faf9ff] to-[#f4f0ff] flex flex-col items-center justify-center p-4">
      {/* Logo */}
      <div className="flex flex-col items-center gap-3 mb-8">
        <div className="w-14 h-14 rounded-2xl bg-[#7c3aed] flex items-center justify-center shadow-lg shadow-purple-200">
          <FlaskConical className="h-8 w-8 text-white" />
        </div>
        <div className="text-center">
          <h1 className="text-2xl font-bold text-[#0f0f11] tracking-tight">Curie Lab</h1>
          <p className="text-sm text-[#6b7280] mt-1">Invite-Only AI Creative Playground</p>
        </div>
      </div>

      {/* Clerk SignIn */}
      <SignIn
        appearance={{
          elements: {
            card: "shadow-xl border border-[#e5e7eb] rounded-2xl",
            headerTitle: "text-[#0f0f11] font-semibold",
            headerSubtitle: "text-[#6b7280]",
            formButtonPrimary:
              "bg-[#7c3aed] hover:bg-[#6d28d9] text-white font-medium",
            footerActionLink: "text-[#7c3aed] hover:text-[#6d28d9]",
          },
        }}
      />

      <p className="mt-6 text-xs text-[#9ca3af] text-center max-w-xs">
        Access is by invitation only. Contact your administrator if you need access.
      </p>
    </div>
  );
}
