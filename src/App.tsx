import { useUser, useAuth } from "@clerk/clerk-react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../convex/_generated/api";
import { useEffect } from "react";
import { LoginPage } from "./components/auth/LoginPage";
import { NotInvitedPage } from "./components/auth/NotInvitedPage";
import { PlaygroundPage } from "./components/playground/PlaygroundPage";
import { Loader2, FlaskConical } from "lucide-react";

function AppContent() {
  const { isSignedIn, isLoaded } = useAuth();
  const { user } = useUser();

  const email = user?.primaryEmailAddress?.emailAddress ?? "";
  const isInvited = useQuery(
    api.users.isInvited,
    isSignedIn && email ? { email } : "skip"
  );

  const upsertUser = useMutation(api.users.upsertUser);

  // Sync user to Convex DB on sign-in
  useEffect(() => {
    if (isSignedIn && user) {
      upsertUser({
        clerkId: user.id,
        email: email,
        name: user.fullName ?? undefined,
        imageUrl: user.imageUrl ?? undefined,
      }).catch(console.error);
    }
  }, [isSignedIn, user?.id]);

  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-[#7c3aed] flex items-center justify-center">
            <FlaskConical className="h-6 w-6 text-white" />
          </div>
          <Loader2 className="h-5 w-5 animate-spin text-[#7c3aed]" />
        </div>
      </div>
    );
  }

  if (!isSignedIn) {
    return <LoginPage />;
  }

  // Waiting for invite check
  if (isInvited === undefined) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-[#7c3aed]" />
      </div>
    );
  }

  if (!isInvited) {
    return <NotInvitedPage />;
  }

  return <PlaygroundPage />;
}

export default function App() {
  return <AppContent />;
}
