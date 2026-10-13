import type { ComponentProps } from "react";
import { render, screen, within } from "@/test-utils/intl";
import LearnBlockView, { type TitleLookup } from "@/components/learn/LearnBlockView";
import type { LearnBlock } from "@/lib/seo/learn/schema";

jest.mock("next/link", () => {
  function MockNextLink({ children, href, ...props }: ComponentProps<"a">) {
    return (
      <a href={typeof href === "string" ? href : "#"} {...props}>
        {children}
      </a>
    );
  }
  return MockNextLink;
});

const TITLES: TitleLookup = {
  guide: (slug) => `Guide ${slug}`,
  article: (slug) => `Article ${slug}`,
};

function draw(block: LearnBlock, figure?: number) {
  return render(<LearnBlockView block={block} figure={figure} titles={TITLES} />).container;
}

describe("LearnBlockView", () => {
  it("draws prose with its inline links", () => {
    const box = draw({ kind: "prose", paragraphs: ["First.", ["Open ", { text: "the settings page", href: "/settings" }, " now."]] });

    expect([...box.querySelectorAll("p")].map((p) => p.textContent)).toEqual(["First.", "Open the settings page now."]);
    expect(screen.getByRole("link", { name: "the settings page" })).toHaveAttribute("href", "/settings");
  });

  it("draws an ordered list as ol and an unordered one as ul", () => {
    expect(draw({ kind: "list", ordered: true, items: ["One", "Two"] }).querySelector("ol")?.textContent).toBe("OneTwo");
    expect(draw({ kind: "list", ordered: false, items: ["Three"] }).querySelector("ul")?.textContent).toBe("Three");
  });

  it("draws a takeaway as an aside", () => {
    expect(draw({ kind: "takeaway", title: "Why", body: "Because." }).querySelector("aside")?.textContent).toBe("WhyBecause.");
  });

  it("draws a board on the server with its pieces, marks and numbered caption", () => {
    const box = draw(
      {
        kind: "board",
        position: { id: "pin", white: ["Bb5", "Kg1"], black: ["Nc6", "Ke8"], toMove: "b", claims: [] },
        arrows: [{ from: "b5", to: "e8", kind: "pin" }],
        marks: [{ square: "c6", kind: "ring" }],
        caption: "The knight on c6 is pinned.",
      },
      2,
    );

    const board = screen.getByRole("img", { name: "Fig. 2 The knight on c6 is pinned. Black to move." });
    expect(board.querySelectorAll(".lg-sq")).toHaveLength(64);
    expect([...board.querySelectorAll(".lg-piece")].map((piece) => `${piece.getAttribute("data-side")}${piece.textContent}`)).toEqual([
      "b♚︎",
      "b♞︎",
      "w♝︎",
      "w♚︎",
    ]);
    expect(box.querySelector("[data-kind='pin'] line")?.getAttribute("x1")).toBe("1.5");
    expect(box.querySelector(".lg-ring")?.getAttribute("x")).toBe("2.06");
    expect(box.querySelector("figure")?.id).toBe("pin");
    expect([...box.querySelectorAll(".lg-board-ranks [data-coord]")].map((label) => label.getAttribute("data-coord")).join("")).toBe("87654321");
    expect([...box.querySelectorAll(".lg-board-files [data-coord]")].map((label) => label.getAttribute("data-coord")).join("")).toBe("abcdefgh");
    expect(box.querySelector(".lg-board-ranks")?.textContent).toBe("");
    expect(box.querySelector(".lg-board-files")?.textContent).toBe("");
  });

  it("draws an image with its size and credit", () => {
    draw({
      kind: "image",
      src: "/images/learn/board.png",
      width: 800,
      height: 600,
      alt: "A board",
      caption: "Caption.",
      credit: { author: "Ann", license: "CC BY 4.0", licenseUrl: null, sourceUrl: "https://example.org/a", changes: "" },
    });

    expect(screen.getByRole("img", { name: "A board" })).toHaveAttribute("width", "800");
    expect(screen.getByRole("link", { name: "Ann, CC BY 4.0" })).toHaveAttribute("href", "https://example.org/a");
  });

  it("gives a drill played on the site a round link and a drill at a board none", () => {
    const box = draw({
      kind: "drills",
      drills: [
        { title: "Six", description: "Play 6 pieces.", duration: "4 minutes", goal: "Clean.", play: { label: "Play 6 pieces, 10 seconds", pieceCount: 6, memorizeTime: 10 } },
        { title: "Board", description: "At home.", duration: "5 minutes", goal: "Circle zeros." },
      ],
    });

    const [played, offline] = [...box.querySelectorAll("article")];
    expect(within(played).getByRole("link", { name: "Play 6 pieces, 10 seconds" })).toHaveAttribute(
      "href",
      "/game?pieceCount=6&memorizeTime=10&source=guide_cta",
    );
    expect(played.querySelector(".lg-chip")?.textContent).toBe("6 pieces · 10 s to look");
    expect(within(offline).queryByRole("link")).toBeNull();
    expect(offline.querySelector(".lg-chip")?.textContent).toBe("At a real board");
  });

  it("draws a table with a header row and row headings", () => {
    draw({ kind: "table", columns: ["Skill", "Now", "Later"], rows: [{ label: "Recall", cells: ["Two", "Six"] }] });

    expect(screen.getAllByRole("columnheader").map((cell) => cell.textContent)).toEqual(["Skill", "Now", "Later"]);
    expect(screen.getByRole("rowheader").textContent).toBe("Recall");
    expect(screen.getAllByRole("cell").map((cell) => cell.textContent)).toEqual(["Two", "Six"]);
  });

  it("draws a plan step by step", () => {
    const box = draw({ kind: "plan", steps: [{ label: "Minutes 0 to 3", duration: "3 minutes", detail: "Three rounds." }] });

    expect(box.querySelector("li")?.textContent).toBe("Minutes 0 to 3" + "3 minutes" + "Three rounds.");
  });

  it("links each kind of call to action to its page", () => {
    draw({ kind: "cta", target: { kind: "game", label: "Play 6 pieces", pieceCount: 6, memorizeTime: 10 }, why: "Warm up." });
    draw({ kind: "cta", target: { kind: "article", slug: "judit-polgar", label: "Judit Polgár" }, why: "Read it." });
    draw({ kind: "cta", target: { kind: "stat", tile: "recentAccuracy", label: "See your recent accuracy" }, why: "Watch it." });

    const links = screen.getAllByRole("link");
    expect(links.map((link) => link.getAttribute("href"))).toEqual([
      "/game?pieceCount=6&memorizeTime=10&source=guide_cta",
      "/articles/judit-polgar",
      "/dashboard#tile-recentAccuracy",
    ]);
    expect(links.map((link) => link.querySelector(".lg-cta-tag")?.textContent)).toEqual([
      "6 pieces · 10 s to look",
      "Article",
      "Dashboard · Recent accuracy",
    ]);
  });

  it("keeps every FAQ answer in the markup inside native details", () => {
    const box = draw({ kind: "faq", items: [{ question: "Why?", answer: "Because." }] });

    expect(box.querySelector("details summary")?.textContent).toBe("Why?");
    expect(box.querySelector("details p")?.textContent).toBe("Because.");
  });

  it("names guides and articles in a reading list by their titles", () => {
    draw({
      kind: "furtherReading",
      items: [
        { kind: "guide", slug: "chess-memory-training", reason: "Next step." },
        { kind: "article", slug: "magnus-carlsen", reason: "A story." },
      ],
    });

    expect(screen.getByRole("link", { name: "Guide chess-memory-training" })).toHaveAttribute("href", "/learn/chess-memory-training");
    expect(screen.getByRole("link", { name: "Article magnus-carlsen" })).toHaveAttribute("href", "/articles/magnus-carlsen");
  });

  it("opens sources in a new tab", () => {
    draw({ kind: "sources", items: [{ title: "A study", url: "https://example.org/s", note: "Recall." }] });

    expect(screen.getByRole("link", { name: "A study" })).toHaveAttribute("target", "_blank");
    expect(screen.getByText("Recall.")).toBeInTheDocument();
  });
});
