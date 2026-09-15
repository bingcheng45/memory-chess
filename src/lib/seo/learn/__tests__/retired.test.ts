import { RETIRED_LEARN_SLUGS, resolveRetiredLearnPath } from "@/lib/seo/learn/retired";
import { LEARN_SLUGS } from "@/lib/seo/learn";

describe("resolveRetiredLearnPath", () => {
  it("sends a retired guide to the guide that absorbed it", () => {
    expect(resolveRetiredLearnPath("/learn/chess-board-vision-drills")).toBe(
      "/learn/how-to-stop-blundering-in-chess",
    );
  });

  it("reaches the final guide in one hop from a locale-prefixed URL", () => {
    expect(resolveRetiredLearnPath("/de/learn/chess-board-vision-drills")).toBe(
      "/learn/how-to-stop-blundering-in-chess",
    );
  });

  it("leaves live guides, the hub and near misses alone", () => {
    expect(resolveRetiredLearnPath("/learn/how-to-stop-blundering-in-chess")).toBeNull();
    expect(resolveRetiredLearnPath("/learn")).toBeNull();
    expect(resolveRetiredLearnPath("/learn/chess-board-vision-drills/extra")).toBeNull();
    expect(resolveRetiredLearnPath("/game")).toBeNull();
  });

  it("only retires slugs that no longer exist, into slugs that do", () => {
    for (const [retired, target] of Object.entries(RETIRED_LEARN_SLUGS)) {
      expect(LEARN_SLUGS).not.toContain(retired);
      expect(LEARN_SLUGS).toContain(target);
    }
  });
});
