import { useClerk, useUser } from "@clerk/clerk-react";
import { Button } from "@/components/ui/button";
import { LogOut, User } from "lucide-react";

export function UserMenu() {
  const { user } = useUser();
  const { signOut } = useClerk();

  if (!user) return null;

  return (
    <div className="flex items-center gap-3">
      <div className="flex items-center gap-2">
        {user.imageUrl ? (
          <img
            src={user.imageUrl}
            alt={user.fullName ?? "User"}
            className="w-7 h-7 rounded-full object-cover"
          />
        ) : (
          <div className="w-7 h-7 rounded-full bg-[#f4f0ff] flex items-center justify-center">
            <User className="h-3.5 w-3.5 text-[#7c3aed]" />
          </div>
        )}
        <span className="text-sm text-[#0f0f11] hidden sm:block">
          {user.firstName ?? user.emailAddresses[0]?.emailAddress}
        </span>
      </div>
      <Button
        variant="ghost"
        size="icon"
        className="h-7 w-7 text-[#6b7280] hover:text-red-500"
        onClick={() => signOut()}
        title="Sign out"
      >
        <LogOut className="h-3.5 w-3.5" />
      </Button>
    </div>
  );
}
