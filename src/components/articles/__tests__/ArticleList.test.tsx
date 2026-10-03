import type { ComponentProps } from "react";
import { act, fireEvent, render, screen, within } from "@/test-utils/intl";
import ArticleList from "@/components/articles/ArticleList";
import { makeArticles, summaryOf } from "@/lib/articles/__tests__/fixtures";

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

const summaries = (count: number) => makeArticles(count).map(summaryOf);
const cards = (container: HTMLElement) =>
  Array.from(container.querySelectorAll<HTMLAnchorElement>('a[href^="/articles/"]'));
const pager = () => screen.queryByRole("navigation", { name: "Pages" });

beforeEach(() => {
  window.history.replaceState(null, "", "/articles");
});

describe("ArticleList", () => {
  it("shows three articles as three cards and no pager", () => {
    const { container } = render(<ArticleList articles={summaries(3)} />);

    expect(cards(container)).toHaveLength(3);
    expect(pager()).not.toBeInTheDocument();
  });

  it("shows no pager for exactly ten articles", () => {
    const { container } = render(<ArticleList articles={summaries(10)} />);

    expect(cards(container)).toHaveLength(10);
    expect(pager()).not.toBeInTheDocument();
  });

  it("makes each card one link holding the portrait, the person, the date, the title and the description", () => {
    const [first] = summaries(1);
    const { container } = render(<ArticleList articles={[first]} />);
    const [card] = cards(container);

    expect(card).toHaveAttribute("href", `/articles/${first.slug}`);
    expect(within(card).getByRole("img", { name: first.photo.alt })).toBeInTheDocument();
    expect(within(card).getByText(first.person.name)).toBeInTheDocument();
    expect(within(card).getByText(first.person.role)).toBeInTheDocument();
    expect(within(card).getByRole("heading", { level: 2, name: first.title })).toBeInTheDocument();
    expect(within(card).getByText(first.description)).toBeInTheDocument();
    expect(card.querySelector("time")).toHaveAttribute("datetime", first.publishedAt);
    expect(card.querySelector("time")).toHaveTextContent("Jan 1, 2026");
    expect(container.querySelectorAll("a")).toHaveLength(1);
  });

  it("names each card link by its title alone", () => {
    const shown = summaries(3);
    const { container } = render(<ArticleList articles={shown} />);

    cards(container).forEach((card, index) => {
      expect(card).toHaveAccessibleName(shown[index].title);
    });
  });

  it("loads the first portrait eagerly and the rest lazily", () => {
    const { container } = render(<ArticleList articles={summaries(3)} />);
    const [first, ...rest] = Array.from(container.querySelectorAll("img")).map((img) =>
      img.getAttribute("loading"),
    );

    expect(first).not.toBe("lazy");
    expect(rest).toEqual(["lazy", "lazy"]);
  });

  it("pages thirteen articles ten at a time and writes the page to the address", () => {
    const all = summaries(13);
    const { container } = render(<ArticleList articles={all} />);

    expect(cards(container)).toHaveLength(10);
    expect(screen.getByText("Showing 1 to 10 of 13")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Page 1" })).toHaveAttribute("aria-current", "page");
    expect(screen.getByRole("button", { name: "Previous page" })).toHaveAttribute("aria-disabled", "true");
    expect(screen.getByRole("button", { name: "Next page" })).toHaveAttribute("aria-disabled", "false");

    fireEvent.click(screen.getByRole("button", { name: "Page 2" }));

    expect(cards(container).map((card) => card.getAttribute("href"))).toEqual(
      all.slice(10).map((article) => `/articles/${article.slug}`),
    );
    expect(window.location.search).toBe("?page=2");
    expect(screen.getByText("Showing 11 to 13 of 13")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Page 2" })).toHaveAttribute("aria-current", "page");
    expect(screen.getByRole("button", { name: "Page 1" })).not.toHaveAttribute("aria-current");
    expect(screen.getByRole("button", { name: "Next page" })).toHaveAttribute("aria-disabled", "true");
  });

  it("steps with the previous and next buttons and drops the query on page one", () => {
    const { container } = render(<ArticleList articles={summaries(13)} />);

    fireEvent.click(screen.getByRole("button", { name: "Next page" }));
    expect(cards(container)).toHaveLength(3);
    expect(window.location.search).toBe("?page=2");

    fireEvent.click(screen.getByRole("button", { name: "Previous page" }));
    expect(cards(container)).toHaveLength(10);
    expect(window.location.search).toBe("");
    expect(window.location.pathname).toBe("/articles");
  });

  it("opens on the page the address names", () => {
    window.history.replaceState(null, "", "/articles?page=2");
    const { container } = render(<ArticleList articles={summaries(13)} />);

    expect(cards(container)).toHaveLength(3);
    expect(screen.getByRole("button", { name: "Page 2" })).toHaveAttribute("aria-current", "page");
  });

  it.each([
    ["99", "Page 2", 3],
    ["0", "Page 1", 10],
    ["abc", "Page 1", 10],
  ])("shows a real page when the address says page=%s", (page, current, shown) => {
    window.history.replaceState(null, "", `/articles?page=${page}`);
    const { container } = render(<ArticleList articles={summaries(13)} />);

    expect(cards(container)).toHaveLength(shown);
    expect(screen.getByRole("button", { current: "page" })).toHaveAccessibleName(current);
  });

  it("stays put when a step button at its end is pressed, and keeps it focusable", () => {
    const { container } = render(<ArticleList articles={summaries(13)} />);
    const previous = screen.getByRole("button", { name: "Previous page" });

    fireEvent.click(previous);

    expect(previous).not.toBeDisabled();
    expect(cards(container)).toHaveLength(10);
    expect(window.location.search).toBe("");
  });

  it("follows the address on Back and Forward", () => {
    const { container } = render(<ArticleList articles={summaries(13)} />);

    act(() => {
      window.history.replaceState(null, "", "/articles?page=2");
      window.dispatchEvent(new PopStateEvent("popstate"));
    });

    expect(cards(container)).toHaveLength(3);
  });

  it("returns to page one when a link leads back to the bare address", () => {
    window.history.replaceState(null, "", "/articles?page=2");
    const all = summaries(13);
    const { container, rerender } = render(<ArticleList articles={all} />);
    expect(cards(container)).toHaveLength(3);

    window.history.pushState(null, "", "/articles");
    rerender(<ArticleList articles={all} />);

    expect(cards(container)).toHaveLength(10);
  });

  it("announces the range it shows", () => {
    render(<ArticleList articles={summaries(13)} />);

    expect(screen.getByText("Showing 1 to 10 of 13")).toHaveAttribute("aria-live", "polite");
  });

  it("keeps other query values when it writes the page", () => {
    window.history.replaceState(null, "", "/articles?ref=home");
    render(<ArticleList articles={summaries(13)} />);

    fireEvent.click(screen.getByRole("button", { name: "Page 2" }));

    expect(new URLSearchParams(window.location.search).get("ref")).toBe("home");
    expect(new URLSearchParams(window.location.search).get("page")).toBe("2");
  });
});
