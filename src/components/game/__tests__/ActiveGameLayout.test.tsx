import { render } from "@/test-utils/intl";
import ActiveGameLayout, {
  activeColumnMinHeight,
} from "@/components/game/ActiveGameLayout";
import { MIN_BOARD_SIZE } from "@/lib/layout";

/**
 * The column that seats the status row, the board and the controls row.
 *
 * Found by the gap it sets rather than by a test id, so the assertions below
 * describe the shipped markup rather than a hook added for them.
 */
const column = () =>
  document.querySelector(".flex-col.gap-2") as HTMLElement;

const renderLayout = () =>
  render(
    <ActiveGameLayout
      status={<div>status</div>}
      board={<div>board</div>}
      controls={<div>controls</div>}
    />,
  );

/** The px figure in a `min-h-[123px]` class, optionally behind a variant. */
const minHeightFor = (className: string, variant: "" | "sm:") => {
  const match = new RegExp(`(?:^| )${variant}min-h-\\[(\\d+)px\\]`).exec(
    className,
  );
  return match ? Number(match[1]) : null;
};

/** The px figure in an `h-20` / `h-[136px]` class, optionally behind a variant. */
const heightFor = (className: string, variant: "" | "sm:") => {
  const arbitrary = new RegExp(`(?:^| )${variant}h-\\[(\\d+)px\\]`).exec(
    className,
  );
  if (arbitrary) return Number(arbitrary[1]);

  // Tailwind's scale: h-20 is 20 * 0.25rem, and 1rem is 16px.
  const scale = new RegExp(`(?:^| )${variant}h-(\\d+)(?![\\[\\w-])`).exec(
    className,
  );
  return scale ? Number(scale[1]) * 4 : null;
};

describe("ActiveGameLayout", () => {
  /**
   * The bug: the status and controls rows are a fixed height and the board is
   * handed whatever is left. On a short viewport -- a phone in landscape --
   * that left around 15px, and because the rows are held to the board's width
   * the timer and palette were narrowed to 15px with it. The active phase
   * locks scrolling, so there was no way to reach a usable board either.
   */
  it("holds the column to a height a playable board fits in", () => {
    renderLayout();

    expect(minHeightFor(column().className, "")).toBe(
      activeColumnMinHeight("base"),
    );
    expect(minHeightFor(column().className, "sm:")).toBe(
      activeColumnMinHeight("sm"),
    );
  });

  /**
   * The floor is only worth having if it clears the rows with a real board
   * left over. Asserted as the property rather than as the two numbers, so
   * growing a row without growing the floor fails here.
   */
  it("leaves a playable board once both rows have taken their height", () => {
    renderLayout();

    const rows = Array.from(
      column().querySelectorAll(":scope > section"),
    ) as HTMLElement[];
    expect(rows).toHaveLength(2);

    (["", "sm:"] as const).forEach((variant) => {
      const rowTotal = rows.reduce(
        (total, row) => total + (heightFor(row.className, variant) ?? 0),
        0,
      );
      // Read back from the markup, not from activeColumnMinHeight: this has
      // to fail when the floor is dropped as well as when it drifts.
      const floor = minHeightFor(column().className, variant) ?? 0;

      expect(rowTotal).toBeGreaterThan(0);
      expect(floor - rowTotal).toBeGreaterThanOrEqual(MIN_BOARD_SIZE);
    });
  });
});
