"use client";

import { FormEvent, useEffect, useState } from "react";
import { Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { FEEDBACK_MAX_LENGTH } from "@/lib/feedbackLimits";
import type { FeedbackSubmission } from "@/lib/feedback";
import { LAB_PAPER_CLASS } from "@/components/lab-paper/shell";
import { readNextEligibleAt, writeNextEligibleAt } from "./feedbackSchedule";

import { useTranslations } from "next-intl";
export const FEEDBACK_PROMPT_DELAY_MS = 800;
export { FEEDBACK_COOLDOWN_MS, FEEDBACK_NEXT_ELIGIBLE_STORAGE_KEY } from "./feedbackSchedule";

export type FeedbackGameContext = Omit<
  FeedbackSubmission,
  "rating" | "feedback"
>;

interface FirstGameFeedbackDialogProps {
  game: FeedbackGameContext;
}

export default function FirstGameFeedbackDialog({
  game,
}: FirstGameFeedbackDialogProps) {
  const t = useTranslations("game.feedback");
  const [isOpen, setIsOpen] = useState(false);
  const [rating, setRating] = useState<number | null>(null);
  const [feedback, setFeedback] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  useEffect(() => {
    if (readNextEligibleAt() > Date.now()) {
      return;
    }

    const promptTimer = window.setTimeout(() => {
      if (readNextEligibleAt() > Date.now()) {
        return;
      }

      writeNextEligibleAt();
      setIsOpen(true);
    }, FEEDBACK_PROMPT_DELAY_MS);

    return () => window.clearTimeout(promptTimer);
  }, []);

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      writeNextEligibleAt();
    }

    setIsOpen(nextOpen);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (rating === null) {
      setSubmitError(t("chooseRating"));
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const response = await fetch("/api/feedback", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...game,
          rating,
          feedback: feedback.trim(),
        }),
      });

      if (!response.ok) {
        throw new Error(t("sendFailed"));
      }

      writeNextEligibleAt();
      setSubmitSuccess(true);
    } catch {
      setSubmitError(
        t("sendFailed"),
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className={`${LAB_PAPER_CLASS} lab-dialog max-h-[90vh] overflow-y-auto sm:max-w-md`}>
        {submitSuccess ? (
          <div className="space-y-5 py-2 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[var(--lp-accent-soft)] text-2xl">
              ✓
            </div>
            <DialogHeader className="text-center sm:text-center">
              <DialogTitle className="text-xl text-[var(--lp-ink)]">{t("sentTitle")}</DialogTitle>
              <DialogDescription className="text-[var(--lp-muted)]">{t("sentBody")}</DialogDescription>
            </DialogHeader>
            <Button
              type="button"
              onClick={() => handleOpenChange(false)}
              className="bg-[var(--lp-accent)] text-[var(--lp-on-accent)] hover:bg-[var(--lp-accent)] hover:text-[var(--lp-on-accent)]"
            >{t("done")}</Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            <DialogHeader className="pr-8 text-left">
              <DialogTitle className="text-xl text-[var(--lp-ink)]">{t("title")}</DialogTitle>
              <DialogDescription className="leading-6 text-[var(--lp-muted)]">{t("description")}</DialogDescription>
            </DialogHeader>

            <fieldset className="space-y-3">
              <legend className="text-sm font-medium text-[var(--lp-ink-2)]">{t("prompt")}</legend>
              <div className="flex items-center gap-2" role="radiogroup">
                {[1, 2, 3, 4, 5].map((star) => (
                  <label
                    key={star}
                    className="cursor-pointer rounded-md p-1 focus-within:ring-2 focus-within:ring-[var(--lp-accent)] focus-within:ring-offset-2 focus-within:ring-offset-[var(--lp-surface)]"
                  >
                    <input
                      type="radio"
                      name="feedback-rating"
                      value={star}
                      checked={rating === star}
                      onChange={() => {
                        setRating(star);
                        setSubmitError(null);
                      }}
                      className="sr-only"
                      aria-label={t("starRating", { count: star })}
                    />
                    <Star
                      aria-hidden="true"
                      className={`h-8 w-8 transition-colors ${
                        rating !== null && star <= rating
                          ? "fill-peach-400 text-[var(--lp-accent)]"
                          : "text-[var(--lp-muted)] hover:text-[var(--lp-accent)]"
                      }`}
                    />
                  </label>
                ))}
              </div>
            </fieldset>

            <div className="space-y-2">
              <label
                htmlFor="game-feedback"
                className="text-sm font-medium text-[var(--lp-ink-2)]"
              >
                {t("commentLabel")}{" "}
                <span className="font-normal text-[var(--lp-muted)]">
                  {t("commentOptional")}
                </span>
              </label>
              <Textarea
                id="game-feedback"
                value={feedback}
                onChange={(event) => setFeedback(event.target.value)}
                maxLength={FEEDBACK_MAX_LENGTH}
                rows={5}
                placeholder={t("placeholder")}
                disabled={isSubmitting}
                className="resize-none border-[var(--lp-line)] bg-[var(--lp-surface)] text-[var(--lp-ink)] placeholder:text-[var(--lp-muted)] focus-visible:ring-[var(--lp-accent)]"
              />
              <p className="text-right text-xs text-[var(--lp-muted)]">
                {feedback.length}/{FEEDBACK_MAX_LENGTH}
              </p>
            </div>

            {submitError && (
              <p role="alert" className="text-sm text-[var(--lp-wrong)]">
                {submitError}
              </p>
            )}

            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                type="button"
                variant="ghost"
                onClick={() => handleOpenChange(false)}
                disabled={isSubmitting}
                className="text-[var(--lp-ink-2)] hover:bg-[var(--lp-surface-2)] hover:text-[var(--lp-ink)]"
              >{t("notNow")}</Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="bg-[var(--lp-accent)] text-[var(--lp-on-accent)] hover:bg-[var(--lp-accent)] hover:text-[var(--lp-on-accent)]"
              >
                {isSubmitting ? t("sending") : t("send")}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
