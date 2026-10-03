import type { ComponentProps } from "react";
import { fireEvent, render } from "@/test-utils/intl";
import { clearArrival } from "@/components/articles/articleArrival";
import {
  ARTICLE_HREF,
  ArticlePage,
  ListPage,
  OtherCard,
  backLink,
  card,
  flush,
  otherCard,
  stubViewTransitions,
} from "@/components/articles/__tests__/flightHarness";
import { setReducedMotion } from "@/components/articles/__tests__/reducedMotion";

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

let mockPathname = "/articles";

jest.mock("@/i18n/navigation", () => ({
  ...jest.requireActual("@/i18n/navigation"),
  useRouter: () => ({ push: jest.fn() }),
  usePathname: () => mockPathname,
}));

beforeEach(() => {
  mockPathname = "/articles";
  setReducedMotion(false);
});

afterEach(() => {
  clearArrival();
  Reflect.deleteProperty(document, "startViewTransition");
});

describe("ArticleLink when two flights overlap", () => {
  it("keeps the name on a card clicked while the flight back to the list is still running", async () => {
    const back = stubViewTransitions();
    mockPathname = ARTICLE_HREF;
    const { rerender } = render(<ArticlePage />);
    fireEvent.click(backLink());
    await flush();
    mockPathname = "/articles";
    rerender(
      <>
        <ListPage />
        <OtherCard />
      </>,
    );
    await flush();
    const another = otherCard();

    stubViewTransitions();
    fireEvent.click(another);
    back.finish();
    await flush();

    expect(another).toHaveAttribute("data-article-flight");
    expect(card()).not.toHaveAttribute("data-article-flight");
  });
});
