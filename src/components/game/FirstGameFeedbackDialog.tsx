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
import { FEEDBACK_MAX_LENGTH, type FeedbackSubmission } from "@/lib/feedback";

import { useTranslations } from "next-intl";
export const FEEDBACK_PROMPT_DELAY_MS = 800;
export const FEEDBACK_COOLDOWN_MS = 24 * 60 * 60 * 1_000;
export const FEEDBACK_NEXT_ELIGIBLE_STORAGE_KEY =
  "memory-chess-feedback-next-eligible-at";

let inMemoryNextEligibleAt = 0;

export type FeedbackGameContext = Omit<
  FeedbackSubmission,
  "rating" | "feedback"
>;

interface FirstGameFeedbackDialogProps {
  game: FeedbackGameContext;
}

function readNextEligibleAt(): number {
  try {
    const storedValue = window.localStorage.getItem(
      FEEDBACK_NEXT_ELIGIBLE_STORAGE_KEY,
    );

    if (storedValue === null) {
      return 0;
    }

    const parsedValue = Number(storedValue);
    return Number.isFinite(parsedValue) ? parsedValue : 0;
  } catch {
    return inMemoryNextEligibleAt;
  }
}

function writeNextEligibleAt(fromTime = Date.now()): void {
  const nextEligibleAt = fromTime + FEEDBACK_COOLDOWN_MS;
  inMemoryNextEligibleAt = nextEligibleAt;

  try {
    window.localStorage.setItem(
      FEEDBACK_NEXT_ELIGIBLE_STORAGE_KEY,
      String(nextEligibleAt),
    );
  } catch {
    // The in-memory value still prevents repeated prompts during this session.
  }
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
      <DialogContent className="max-h-[90vh] overflow-y-auto border border-bg-light bg-bg-card text-text-primary sm:max-w-md">
        {submitSuccess ? (
          <div className="space-y-5 py-2 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-peach-500/10 text-2xl">
              ✓
            </div>
            <DialogHeader className="text-center sm:text-center">
              <DialogTitle className="text-xl text-text-primary">{t("sentTitle")}</DialogTitle>
              <DialogDescription className="text-text-muted">{t("sentBody")}</DialogDescription>
            </DialogHeader>
            <Button
              type="button"
              onClick={() => handleOpenChange(false)}
              className="bg-peach-500 text-white hover:bg-peach-600 hover:text-white"
            >{t("done")}</Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            <DialogHeader className="pr-8 text-left">
              <DialogTitle className="text-xl text-text-primary">{t("title")}</DialogTitle>
              <DialogDescription className="leading-6 text-text-muted">
                How was your experience? Your feedback helps make each training
                session better.
              </DialogDescription>
            </DialogHeader>

            <fieldset className="space-y-3">
              <legend className="text-sm font-medium text-text-secondary">{t("prompt")}</legend>
              <div className="flex items-center gap-2" role="radiogroup">
                {[1, 2, 3, 4, 5].map((star) => (
                  <label
                    key={star}
                    className="cursor-pointer rounded-md p-1 focus-within:ring-2 focus-within:ring-peach-500 focus-within:ring-offset-2 focus-within:ring-offset-bg-card"
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
                          ? "fill-peach-400 text-peach-400"
                          : "text-text-muted hover:text-peach-300"
                      }`}
                    />
                  </label>
                ))}
              </div>
            </fieldset>

            <div className="space-y-2">
              <label
                htmlFor="game-feedback"
                className="text-sm font-medium text-text-secondary"
              >
                {t("commentLabel")}{" "}
                <span className="font-normal text-text-muted">
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
                className="resize-none border-bg-light bg-bg-dark/60 text-text-primary placeholder:text-text-muted focus-visible:ring-peach-500"
              />
              <p className="text-right text-xs text-text-muted">
                {feedback.length}/{FEEDBACK_MAX_LENGTH}
              </p>
            </div>

            {submitError && (
              <p role="alert" className="text-sm text-red-400">
                {submitError}
              </p>
            )}

            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                type="button"
                variant="ghost"
                onClick={() => handleOpenChange(false)}
                disabled={isSubmitting}
                className="text-text-secondary hover:bg-bg-light hover:text-white"
              >{t("notNow")}</Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="bg-peach-500 text-white hover:bg-peach-600 hover:text-white"
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
