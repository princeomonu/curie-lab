import { useAuthActions } from "@convex-dev/auth/react";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Button } from "@/components/ui/button";
import { LogOut, User } from "lucide-react";

export function UserMenu() {
  const { signOut } = useAuthActions();
  const viewer = useQuery(api.users.viewer);

  if (!viewer) return null;

  return (
    <div className="flex items-center gap-3">
      <div className="flex items-center gap-2">
        {viewer.image ? (
          <img
            src={viewer.image}
            alt={viewer.name ?? "User"}
            className="w-7 h-7 rounded-full object-cover"
          />
        ) : (
          <div className="w-7 h-7 rounded-full bg-[#f4f0ff] flex items-center justify-center">
            <User className="h-3.5 w-3.5 text-[#7c3aed]" />
          </div>
        )}
        <span className="text-sm text-[#0f0f11] hidden sm:block">
          {viewer.name ?? viewer.email}
        </span>
      </div>
      <Button
        variant="ghost"
        size="icon"
        className="h-7 w-7 text-[#6b7280] hover:text-red-500"
        onClick={() => void signOut()}
        title="Sign out"
      >
        <LogOut className="h-3.5 w-3.5" />
      </Button>
    </div>
  );
}
