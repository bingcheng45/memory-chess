import type { ReactElement, ReactNode } from "react";
import { isValidElement } from "react";
import { render } from "@/test-utils/intl";
import LocaleLayout from "@/app/[locale]/layout";
import HomePage from "@/app/[locale]/page";
import PrivacyPage from "@/app/[locale]/privacy/page";
import ContactUsPage from "@/app/[locale]/contact-us/page";
import Footer from "@/components/ui/Footer";

jest.mock("next-intl/server", () => ({
  ...jest.requireActual("next-intl/server"),
  setRequestLocale: jest.fn(),
}));

jest.mock("next/navigation", () => ({
  ...jest.requireActual("next/navigation"),
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
    back: jest.fn(),
  }),
  usePathname: () => "/",
  useSearchParams: () => new URLSearchParams(),
}));

function countComponent(node: ReactNode, component: unknown): number {
  if (Array.isArray(node)) {
    return node.reduce<number>(
      (sum, child) => sum + countComponent(child, component),
      0,
    );
  }
  if (!isValidElement(node)) return 0;
  const element = node as ReactElement<{ children?: ReactNode }>;
  const self = element.type === component ? 1 : 0;
  return self + countComponent(element.props.children, component);
}

describe("footer placement", () => {
  // The locale layout is the footer's single render site: it is what puts a
  // footer on /game and /leaderboard, which used to be navigational dead
  // ends, without any page rendering a second one.
  it("renders Footer exactly once, from the locale layout", async () => {
    const tree = await LocaleLayout({
      children: <div />,
      params: Promise.resolve({ locale: "en" }),
    });

    expect(countComponent(tree, Footer)).toBe(1);
  });

  const pages: Array<[string, () => ReactElement]> = [
    ["home", () => <HomePage />],
    ["privacy", () => <PrivacyPage />],
    ["contact-us", () => <ContactUsPage />],
  ];

  it.each(pages)("the %s page renders no footer of its own", (_name, page) => {
    const { container } = render(page());

    expect(container.querySelectorAll("footer")).toHaveLength(0);
  });
});
