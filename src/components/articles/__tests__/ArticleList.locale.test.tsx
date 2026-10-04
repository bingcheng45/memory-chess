import type { ComponentProps } from "react";
import { render, screen, within } from "@/test-utils/intl";
import ArticleList from "@/components/articles/ArticleList";
import { GERMAN_MESSAGES } from "@/components/articles/__tests__/chromeCatalogues";
import { makeArticles, summaryOf } from "@/lib/articles/__tests__/fixtures";
import type { ArticleStats } from "@/lib/articles/stats";

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

jest.mock("@/i18n/navigation", () => ({
  ...jest.requireActual("@/i18n/navigation"),
  useRouter: () => ({ push: jest.fn() }),
  usePathname: () => "/articles",
}));

const ENGLISH_CHROME = ["Sort", "Newest", "Most viewed", "Most liked", "Showing", "Page", "views", "likes"];
const STATS: ArticleStats = {
  "alder-fixture": { views: 2140, likes: 1 },
  "birch-fixture": { views: 1, likes: 1873 },
};
const GERMAN_DATE_OF_ANOTHER_DAY = "3. Okt. 2026";

const summaries = makeArticles(12).map((article) => ({
  ...summaryOf(article),
  publishedLabel: GERMAN_DATE_OF_ANOTHER_DAY,
}));

function renderGerman() {
  return render(<ArticleList articles={summaries} stats={STATS} heading={<h1>Artikel</h1>} />, {
    locale: "de",
    messages: GERMAN_MESSAGES,
  });
}

beforeEach(() => {
  window.history.replaceState(null, "", "/de/articles");
  window.localStorage.clear();
});

describe("ArticleList under a German catalogue", () => {
  it("names the sort control and its options in German", () => {
    renderGerman();
    const group = screen.getByRole("group", { name: "Artikel ordnen" });

    expect(within(group).getAllByRole("button").map((option) => option.textContent)).toEqual([
      "Neueste",
      "Meistgesehen",
      "Beliebteste",
    ]);
    expect(screen.getByText("Reihenfolge")).toHaveAttribute("aria-hidden", "true");
  });

  it("names the pager, its steps and its pages in German", () => {
    renderGerman();
    const pager = screen.getByRole("navigation", { name: "Seiten" });

    expect(within(pager).getByText("1 bis 10 von 12")).toHaveAttribute("aria-live", "polite");
    expect(within(pager).getAllByRole("button").map((button) => button.getAttribute("aria-label"))).toEqual([
      "Vorherige Seite",
      "Seite 1",
      "Seite 2",
      "Nächste Seite",
    ]);
  });

  it("counts views and likes in German, grouped the German way", () => {
    const { container } = renderGerman();
    const counts = Array.from(container.querySelectorAll("[data-article-counts]"), (line) =>
      Array.from(line.querySelectorAll("span"), (span) => span.textContent),
    );

    expect(counts).toEqual([
      ["2.140 Aufrufe", "1 Empfehlung"],
      ["1 Aufruf", "1.873 Empfehlungen"],
    ]);
  });

  it("prints on each card the date label it was handed, and formats no date of its own", () => {
    const { container } = renderGerman();
    const dates = Array.from(container.querySelectorAll("time"));

    expect(dates).toHaveLength(10);
    expect(dates[0]).toHaveAttribute("datetime", "2026-01-01T00:00:00.000Z");
    for (const date of dates) expect(date).toHaveTextContent(/^3\. Okt\. 2026$/);
  });

  it("shows none of the English labels", () => {
    const { container } = renderGerman();
    const controls = [
      ...Array.from(container.querySelectorAll("nav, [role='group'], [data-article-counts]"), (node) => node.textContent),
      ...Array.from(container.querySelectorAll("[aria-label]"), (node) => node.getAttribute("aria-label")),
      screen.getByText("Reihenfolge").textContent,
    ].join("\n");

    expect(controls).toContain("Meistgesehen");
    for (const english of ENGLISH_CHROME) expect(controls).not.toContain(english);
  });
});
