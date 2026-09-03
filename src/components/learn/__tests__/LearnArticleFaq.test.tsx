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
    for (const page of EN_LEARN_PAGES) {
      const { container, unmount } = render(
        <LearnArticleRich
          page={page}
          goals={EN_LEARN_GOALS}
          allPages={EN_LEARN_PAGES}
          locale="en"
        />,
      );

      // The FAQPage JSON-LD also carries the answers, so raw textContent
      // passes even when the accordion unmounts them. Strip scripts to
      // assert on what a reader of the HTML sees.
      const visible = container.cloneNode(true) as HTMLElement;
      visible.querySelectorAll("script").forEach((node) => node.remove());
      const text = visible.textContent ?? "";

      expect(page.faq.length).toBeGreaterThan(0);
      for (const entry of page.faq) {
        expect(text).toContain(entry.answer);
      }

      unmount();
    }
  });
});
