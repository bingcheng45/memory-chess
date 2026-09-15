import type { ComponentProps } from "react";
import { render } from "@/test-utils/intl";
import LearnArticleRich from "@/components/learn/LearnArticleRich";
import { EN_LEARN_PAGES, EN_LEARN_GOALS } from "@/lib/seo/learn";

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

jest.mock("@/components/ui/PageHeader", () => {
  function MockPageHeader() {
    return <div>PageHeader</div>;
  }

  return MockPageHeader;
});

jest.mock("@/components/ui/Footer", () => {
  function MockFooter() {
    return <div>Footer</div>;
  }

  return MockFooter;
});

jest.mock("@/components/learn/LearnArticleTracking", () => {
  function MockLearnArticleTracking() {
    return null;
  }

  return MockLearnArticleTracking;
});

describe("LearnArticleRich FAQ", () => {
  it("keeps every FAQ answer in the DOM whether its item is open or closed", () => {
    const pagesWithFaq = EN_LEARN_PAGES.filter((page) => page.faq.length > 0);
    expect(pagesWithFaq.length).toBeGreaterThan(0);

    for (const page of pagesWithFaq) {
      const { container, unmount } = render(
        <LearnArticleRich
          page={page}
          goals={EN_LEARN_GOALS}
          allPages={EN_LEARN_PAGES}        />,
      );

      // The FAQPage JSON-LD also carries the answers, so raw textContent
      // passes even when the accordion unmounts them. Strip scripts to
      // assert on what a reader of the HTML sees.
      const visible = container.cloneNode(true) as HTMLElement;
      visible.querySelectorAll("script").forEach((node) => node.remove());
      const text = visible.textContent ?? "";

      for (const entry of page.faq) {
        expect(text).toContain(entry.answer);
      }

      unmount();
    }
  });

  it("leaves out the FAQ section, its schema node and its contents entry when a guide has no questions", () => {
    const page = EN_LEARN_PAGES.find(
      (entry) => entry.slug === "20-minute-daily-chess-study-plan",
    );
    if (!page) throw new Error("20-minute-daily-chess-study-plan is missing");
    expect(page.faq).toEqual([]);

    const { container } = render(
      <LearnArticleRich
        page={page}
        goals={EN_LEARN_GOALS}
        allPages={EN_LEARN_PAGES}
      />,
    );

    const script = container.querySelector('script[type="application/ld+json"]');
    const graph: Array<{ "@type": string }> = JSON.parse(script?.textContent ?? "{}")["@graph"];
    expect(graph.map((node) => node["@type"])).not.toContain("FAQPage");

    expect(container.querySelector("#faq")).toBeNull();
    expect(page.tableOfContents.map((item) => item.id)).not.toContain("faq");
    expect(container.querySelector('a[href="#faq"]')).toBeNull();
  });
});
