import { render } from "@/test-utils/intl";
import { LikeCount, ViewCount } from "@/components/articles/ArticleCounts";
import { GERMAN_MESSAGES } from "@/components/articles/__tests__/chromeCatalogues";

describe("the view and like counts", () => {
  it.each([
    [1, "1 view", "1 like"],
    [2, "2 views", "2 likes"],
    [187, "187 views", "187 likes"],
    [2140, "2,140 views", "2,140 likes"],
    [1000000, "1,000,000 views", "1,000,000 likes"],
  ])("write %i as %s and %s", (count, views, likes) => {
    const { container } = render(
      <p>
        <ViewCount count={count} />
        <LikeCount count={count} />
      </p>,
    );

    expect(Array.from(container.querySelectorAll("span"), (span) => span.textContent)).toEqual([views, likes]);
  });

  it.each([
    [1, "1 Aufruf", "1 Empfehlung"],
    [2140, "2.140 Aufrufe", "2.140 Empfehlungen"],
  ])("write %i in the plural form and the digit grouping of the page's language", (count, views, likes) => {
    const { container } = render(
      <p>
        <ViewCount count={count} />
        <LikeCount count={count} />
      </p>,
      { locale: "de", messages: GERMAN_MESSAGES },
    );

    expect(Array.from(container.querySelectorAll("span"), (span) => span.textContent)).toEqual([views, likes]);
  });

  it("print nothing for no count or a count of zero, next to a count that does print", () => {
    const { container } = render(
      <p>
        <ViewCount count={undefined} />
        <LikeCount count={0} />
        <ViewCount count={3} />
      </p>,
    );

    expect(container.querySelector("p")?.textContent).toBe("3 views");
  });

  it("keep the icon out of the accessibility tree", () => {
    const { container } = render(<ViewCount count={3} />);

    expect(container.querySelector("svg")).toHaveAttribute("aria-hidden", "true");
  });
});
