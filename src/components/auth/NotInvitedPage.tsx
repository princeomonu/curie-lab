import { useAuthActions } from "@convex-dev/auth/react";
import { Lock } from "lucide-react";
import { Button } from "@/components/ui/button";

export function NotInvitedPage() {
  const { signOut } = useAuthActions();

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-[#faf9ff] to-[#f4f0ff] flex flex-col items-center justify-center p-4">
      <div className="flex flex-col items-center gap-4 max-w-sm text-center">
        <div className="w-14 h-14 rounded-2xl bg-[#f4f0ff] border-2 border-[#7c3aed]/20 flex items-center justify-center">
          <Lock className="h-7 w-7 text-[#7c3aed]" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-[#0f0f11]">Access Restricted</h1>
          <p className="text-sm text-[#6b7280] mt-2">
            Your account isn't on the invite list. Curie Lab is invite-only.
            Please contact your administrator for access.
          </p>
        </div>
        <Button variant="outline" onClick={() => void signOut()}>
          Sign Out
        </Button>
      </div>
    </div>
  );
}
