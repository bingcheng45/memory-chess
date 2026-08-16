import type { ComponentProps } from "react";
import { render, screen } from "@testing-library/react";
import LearnArticleRich from "@/components/learn/LearnArticleRich";
import { getLearnPageBySlug } from "@/lib/seo/learnPages";

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

  MockPageHeader.displayName = "MockPageHeader";

  return MockPageHeader;
});

jest.mock("@/components/ui/Footer", () => {
  function MockFooter() {
    return <div>Footer</div>;
  }

  MockFooter.displayName = "MockFooter";

  return MockFooter;
});

jest.mock("@/components/learn/LearnArticleTracking", () => {
  function MockLearnArticleTracking() {
    return null;
  }

  MockLearnArticleTracking.displayName = "MockLearnArticleTracking";

  return MockLearnArticleTracking;
});
describe("LearnArticleRich", () => {
  it("renders the direct answer, practice ideas, and reference links", () => {
    const page = getLearnPageBySlug("how-to-get-better-at-chess-for-beginners");

    const { container } = render(<LearnArticleRich page={page} />);

    expect(screen.getByText("Start here")).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Practice in Memory Chess" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Reference links" }),
    ).toBeInTheDocument();
    expect(screen.getByText(/Use a short daily routine/i)).toBeInTheDocument();
    expect(container.querySelectorAll("img")).toHaveLength(0);

    const allClasses = Array.from(container.querySelectorAll("[class]"))
      .map((element) => element.getAttribute("class") ?? "")
      .join(" ");

    expect(allClasses).toContain("max-w-[68ch]");
    expect(allClasses).toContain("border-white/10");
    expect(allClasses).not.toContain("font-black");
    expect(allClasses).not.toContain("rounded-3xl");
    expect(allClasses).not.toContain("shadow-[");

    const schemaScript = container.querySelector(
      'script[type="application/ld+json"]',
    );
    const schema = JSON.parse(schemaScript?.textContent ?? "{}");
    const article = schema["@graph"].find(
      (entry: { "@type": string }) => entry["@type"] === "Article",
    );

    expect(article.image.url).toBe(
      "https://thememorychess.com/learn/how-to-get-better-at-chess-for-beginners/opengraph-image",
    );
    expect(
      schema["@graph"].map((entry: { "@type": string }) => entry["@type"]),
    ).toEqual(
      expect.arrayContaining([
        "Article",
        "WebPage",
        "BreadcrumbList",
        "FAQPage",
      ]),
    );
  });

  it("renders clear links to the next guides", () => {
    const page = getLearnPageBySlug("how-to-stop-blundering-in-chess");

    render(<LearnArticleRich page={page} />);

    expect(
      screen.getByRole("heading", { name: "What to learn next" }),
    ).toBeInTheDocument();
    expect(
      screen.getAllByRole("link", { name: /Read this guide/i }),
    ).not.toHaveLength(0);
  });
});
