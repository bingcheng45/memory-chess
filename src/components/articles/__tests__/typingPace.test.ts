import {
  BLOCK_START,
  DEFAULT_CHARS_PER_SECOND,
  advance,
  isFinished,
  placementOf,
  type BlockProgress,
} from "@/components/articles/typingPace";

const FRAME_MS = 20;
const CHARS_PER_FRAME = 3;
const FRAMES_PER_SECOND = 1000 / FRAME_MS;
const PARAGRAPH = { length: 600, kind: "paragraph", charsPerSecond: DEFAULT_CHARS_PER_SECOND } as const;
const HEADING = { length: 20, kind: "heading", charsPerSecond: DEFAULT_CHARS_PER_SECOND } as const;
const FRAMES_TO_TYPE_PARAGRAPH = PARAGRAPH.length / CHARS_PER_FRAME;
const FRAMES_TO_TYPE_HEADING = Math.ceil(HEADING.length / CHARS_PER_FRAME);

function run(block: Parameters<typeof advance>[1], frames: number, from: BlockProgress = BLOCK_START) {
  let progress = from;
  for (let frame = 0; frame < frames; frame++) {
    progress = advance(progress, block, FRAME_MS, "inside");
  }
  return progress;
}

describe("advance", () => {
  it("types at the fast speed, 150 characters a second", () => {
    expect(run(PARAGRAPH, FRAMES_PER_SECOND).chars).toBe(150);
  });

  it("types at the rate the block carries", () => {
    const slow = { ...PARAGRAPH, charsPerSecond: 75 };

    expect(run(slow, FRAMES_PER_SECOND).chars).toBe(75);
    expect(run({ ...PARAGRAPH, charsPerSecond: 300 }, FRAMES_PER_SECOND).chars).toBe(300);
  });

  it("carries the fraction of a character a frame leaves over", () => {
    const afterOneFrame = advance(BLOCK_START, PARAGRAPH, 16, "inside");

    expect(afterOneFrame.chars).toBe(2);
    expect(afterOneFrame.carry).toBeCloseTo(0.4);
  });

  it("returns a new value and leaves its input alone", () => {
    const before = { ...BLOCK_START };
    const after = advance(BLOCK_START, PARAGRAPH, FRAME_MS, "inside");

    expect(after).not.toBe(BLOCK_START);
    expect(BLOCK_START).toEqual(before);
  });

  it("counts a long frame as 64 ms, so a stalled tab does not dump a paragraph", () => {
    expect(advance(BLOCK_START, PARAGRAPH, 5000, "inside").chars).toBe(9);
  });

  it("stops at the end of the block and drops the overshoot", () => {
    const typed = run(HEADING, FRAMES_TO_TYPE_HEADING);

    expect(typed.chars).toBe(HEADING.length);
    expect(typed.carry).toBe(0);
  });

  it("rests 140 ms after a heading", () => {
    const typed = run(HEADING, FRAMES_TO_TYPE_HEADING);
    const restFrames = 140 / FRAME_MS;

    expect(typed.restMs).toBe(140);
    expect(isFinished(typed, HEADING.length)).toBe(false);
    expect(isFinished(run(HEADING, restFrames - 1, typed), HEADING.length)).toBe(false);
    expect(isFinished(run(HEADING, restFrames, typed), HEADING.length)).toBe(true);
  });

  it("rests 280 ms after a paragraph", () => {
    const typed = run(PARAGRAPH, FRAMES_TO_TYPE_PARAGRAPH);
    const restFrames = 280 / FRAME_MS;

    expect(typed.chars).toBe(PARAGRAPH.length);
    expect(typed.restMs).toBe(280);
    expect(isFinished(run(PARAGRAPH, restFrames - 1, typed), PARAGRAPH.length)).toBe(false);
    expect(isFinished(run(PARAGRAPH, restFrames, typed), PARAGRAPH.length)).toBe(true);
  });

  it("holds a block that has not started while it is below the viewport", () => {
    expect(advance(BLOCK_START, PARAGRAPH, FRAME_MS, "below")).toEqual(BLOCK_START);
  });

  it("keeps typing a block that already started when it leaves through the bottom", () => {
    const started = run(PARAGRAPH, 10);

    expect(advance(started, PARAGRAPH, FRAME_MS, "below").chars).toBe(started.chars + CHARS_PER_FRAME);
  });

  it("finishes a block the reader scrolled past at once, with no rest", () => {
    const skipped = advance(run(PARAGRAPH, 3), PARAGRAPH, FRAME_MS, "above");

    expect(skipped.chars).toBe(PARAGRAPH.length);
    expect(isFinished(skipped, PARAGRAPH.length)).toBe(true);
  });

  it("treats an empty block as finished", () => {
    expect(isFinished(BLOCK_START, 0)).toBe(true);
  });
});

describe("placementOf", () => {
  const VIEWPORT = 800;

  it("is inside when the top is in the viewport, 48px or more above its bottom edge", () => {
    expect(placementOf({ top: 100, bottom: 300 }, VIEWPORT)).toBe("inside");
    expect(placementOf({ top: VIEWPORT - 48, bottom: 900 }, VIEWPORT)).toBe("inside");
  });

  it("is below when the top sits in the last 48px or under the viewport", () => {
    expect(placementOf({ top: VIEWPORT - 47, bottom: 900 }, VIEWPORT)).toBe("below");
  });

  it("is above only when the whole block has left through the top", () => {
    expect(placementOf({ top: -300, bottom: -1 }, VIEWPORT)).toBe("above");
    expect(placementOf({ top: -300, bottom: 10 }, VIEWPORT)).toBe("inside");
  });
});

