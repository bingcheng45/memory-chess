import type { ComponentProps } from "react";
import { render, screen } from "@/test-utils/intl";
import ArticlePage from "@/components/articles/ArticlePage";
import { makeArticle } from "@/lib/articles/__tests__/fixtures";

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

jest.mock("@/components/ui/PageHeader", () => () => null);

jest.mock("@/components/articles/TypedBody", () => {
  function MockTypedBody({ charsPerSecond }: { charsPerSecond?: number }) {
    return <div data-testid="typed-body">{String(charsPerSecond)}</div>;
  }

  return MockTypedBody;
});

const article = makeArticle(0);

beforeEach(() => {
  global.fetch = jest.fn().mockResolvedValue({ status: 200, json: async () => ({ views: 1, likes: 0 }) });
});

afterEach(() => {
  window.sessionStorage.clear();
  Reflect.deleteProperty(global, "fetch");
});

describe("ArticlePage typing rate", () => {
  it("hands the body the rate it was given", () => {
    render(<ArticlePage article={article} charsPerSecond={75} />);

    expect(screen.getByTestId("typed-body")).toHaveTextContent(/^75$/);
  });
});
