"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { ShieldCheck, Send, CheckCircle2, AlertCircle } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { applicationApi } from "@/lib/api";
import { DIVISION_LABEL, VALORANT_ROLE_LABEL } from "@/lib/constants";
import type { Team } from "@/lib/types";

interface ApplyTeamModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  team: Team | null;
  onApplied?: (teamId: string) => void;
}

export function ApplyTeamModal({ open, onOpenChange, team, onApplied }: ApplyTeamModalProps) {
  const router = useRouter();
  const [message, setMessage] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [success, setSuccess] = React.useState(false);

  React.useEffect(() => {
    if (open) {
      setMessage("");
      setError(null);
      setSuccess(false);
    }
  }, [open]);

  if (!team) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      await applicationApi.submit(team.id, message);
      setSuccess(true);
      onApplied?.(team.id);
      setTimeout(() => {
        onOpenChange(false);
        router.push("/my-applications");
      }, 1500);
    } catch (err) {
      const errMsg =
        (err as { response?: { data?: { error?: string; message?: string } } })?.response?.data?.error ??
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        "Failed to submit application. Make sure you have a published Scout Card.";
      setError(errMsg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-primary">Apply to Team</span>
            <DialogTitle>{team.name}</DialogTitle>
            <div className="mt-1 flex flex-wrap items-center gap-1.5">
              {team.division && <Badge>{DIVISION_LABEL[team.division]}</Badge>}
              {team.recruitingRoles?.map((r) => (
                <Badge key={r} variant="secondary">
                  {VALORANT_ROLE_LABEL[r]}
                </Badge>
              ))}
            </div>
          </div>
          <DialogClose onClick={() => onOpenChange(false)} />
        </DialogHeader>

        {success ? (
          <div className="py-6 text-center">
            <CheckCircle2 size={40} className="mx-auto mb-3 text-success" />
            <h3 className="font-display text-xl font-bold uppercase text-foreground">Application Submitted!</h3>
            <p className="mt-1 text-xs text-foreground-muted">
              The team captain has received your Scout Card. Redirecting to your applications…
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 pt-2">
            <div>
              <label htmlFor="message" className="mb-1.5 block text-xs font-semibold uppercase text-foreground-muted">
                Cover Note / Message to Captain (Optional)
              </label>
              <textarea
                id="message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                maxLength={500}
                rows={4}
                placeholder="Tell the captain about your agent comfort, team history, or willingness to trial for practice hours…"
                className="w-full resize-none rounded-sm border border-border bg-muted p-3 text-xs text-foreground outline-none placeholder:text-foreground-muted/50 focus:border-primary"
              />
              <div className="mt-1 flex justify-between text-[10px] text-foreground-muted">
                <span>Your Scout Card with verified rank and schedule will be attached automatically.</span>
                <span>{message.length}/500</span>
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 rounded-sm border border-danger/30 bg-danger/10 p-2.5 text-xs text-danger">
                <AlertCircle size={14} className="shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-border/80">
              <Button type="button" variant="outline" size="sm" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" size="sm" disabled={submitting}>
                <Send size={13} /> {submitting ? "Submitting…" : "Send Application"}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
