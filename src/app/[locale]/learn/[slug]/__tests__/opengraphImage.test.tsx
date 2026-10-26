import type { ReactNode } from "react";
import LearnOpenGraphImage from "../opengraph-image";

let element: ReactNode;
jest.mock("next/og", () => ({
  ImageResponse: class {
    constructor(node: ReactNode) {
      element = node;
    }
  },
}));

function textOf(node: ReactNode): string {
  if (typeof node === "string" || typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map(textOf).join("|");
  if (node && typeof node === "object" && "props" in node) return textOf((node.props as { children?: ReactNode }).children);
  return "";
}

describe("the learn share image", () => {
  it("headlines the English visualization guide with its search title", async () => {
    await LearnOpenGraphImage({ params: Promise.resolve({ slug: "chess-visualization-exercises" }) });

    expect(textOf(element)).toContain("Chess Visualization Exercises: Test and Train");
    expect(textOf(element)).not.toContain("See the Board");
  });
});
