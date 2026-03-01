import { useConvexAuth, useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import { LoginPage } from "./components/auth/LoginPage";
import { NotInvitedPage } from "./components/auth/NotInvitedPage";
import { PlaygroundPage } from "./components/playground/PlaygroundPage";
import { Loader2, FlaskConical } from "lucide-react";

function AppContent() {
  const { isAuthenticated, isLoading } = useConvexAuth();

  const isInvited = useQuery(
    api.users.isInvited,
    isAuthenticated ? {} : "skip"
  );

  if (isLoading) {
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

  if (!isAuthenticated) {
    return <LoginPage />;
  }

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
