/**
 * The lab card's frame and the height it keeps, drawn before the card's code and the record arrive, so nothing under
 * it moves when the card fills in. The height fits the card's longest lines at every width.
 */
export const RESULT_LAB_FRAME = "w-full rounded-xl border border-bg-light bg-bg-card p-4 sm:p-6 min-h-[240px] sm:min-h-[212px]";

export default function ResultLabSlot() {
  return <div aria-hidden="true" data-testid="result-lab-slot" className={RESULT_LAB_FRAME} />;
}
