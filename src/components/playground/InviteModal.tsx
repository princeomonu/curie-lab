import { useState } from "react";
import { useAction, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, Send, CheckCircle2, Clock, UserX } from "lucide-react";

interface Props {
  open: boolean;
  onClose: () => void;
}

export function InviteModal({ open, onClose }: Props) {
  const sendInvite = useAction(api.invites.sendInvite);
  const invites = useQuery(api.invites.listInvites);

  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<
    { ok: true } | { ok: false; message: string } | null
  >(null);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setLoading(true);
    setResult(null);
    try {
      const res = await sendInvite({ email: email.trim() });
      if ("success" in res) {
        setResult({ ok: true });
        setEmail("");
      } else {
        setResult({ ok: false, message: res.error });
      }
    } catch {
      setResult({ ok: false, message: "Failed to send invite." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Invite Someone</DialogTitle>
          <DialogDescription>
            Send an invite link via email. The link expires in 7 days.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSend} className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="invite-email" className="text-xs text-[#374151]">
              Email address
            </Label>
            <div className="flex gap-2">
              <Input
                id="invite-email"
                type="email"
                placeholder="friend@example.com"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setResult(null);
                }}
                required
                className="flex-1"
              />
              <Button type="submit" disabled={loading} className="gap-1.5 shrink-0">
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
                Send
              </Button>
            </div>
          </div>

          {result?.ok && (
            <div className="flex items-center gap-2 text-xs text-green-700 bg-green-50 border border-green-100 rounded-md px-3 py-2">
              <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
              Invite sent! They'll receive an email shortly.
            </div>
          )}
          {result && !result.ok && (
            <p className="text-xs text-red-600 bg-red-50 border border-red-100 rounded-md px-3 py-2">
              {result.message}
            </p>
          )}
        </form>

        {/* Invite history */}
        {invites && invites.length > 0 && (
          <div className="mt-1">
            <p className="text-xs font-semibold text-[#6b7280] uppercase tracking-wider mb-2">
              Sent Invites
            </p>
            <ScrollArea className="max-h-56">
              <div className="space-y-1.5 pr-2">
                {(invites as Array<{ _id: string; email: string; usedAt?: number; expiresAt?: number }>).map((inv) => {
                  const isUsed = !!inv.usedAt;
                  const isExpired =
                    !isUsed && inv.expiresAt !== undefined && inv.expiresAt < Date.now();

                  return (
                    <div
                      key={inv._id}
                      className="flex items-center justify-between py-1.5 px-2 rounded-md bg-[#f8f8f8] gap-2"
                    >
                      <span className="text-xs text-[#0f0f11] truncate flex-1">
                        {inv.email}
                      </span>
                      {isUsed ? (
                        <Badge variant="success" className="gap-1 text-[10px] shrink-0">
                          <CheckCircle2 className="h-2.5 w-2.5" />
                          Joined
                        </Badge>
                      ) : isExpired ? (
                        <Badge variant="destructive" className="gap-1 text-[10px] shrink-0">
                          <UserX className="h-2.5 w-2.5" />
                          Expired
                        </Badge>
                      ) : (
                        <Badge variant="warning" className="gap-1 text-[10px] shrink-0">
                          <Clock className="h-2.5 w-2.5" />
                          Pending
                        </Badge>
                      )}
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
