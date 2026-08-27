import type { ComponentProps } from "react";
import { render, screen } from "@/test-utils/intl";
import LearnHubPageContent from "@/components/learn/LearnHubPageContent";
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

describe("LearnHubPageContent", () => {
  it("uses the shared editorial layout and plain guidance", () => {
    const { container } = render(<LearnHubPageContent allPages={EN_LEARN_PAGES} goals={EN_LEARN_GOALS} locale="en" />);

    expect(
      screen.getByRole("heading", {
        name: "Learn Chess One Clear Step at a Time",
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Choose a Goal" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Pick Your Next Step" }),
    ).toBeInTheDocument();
    expect(screen.queryByText(/search intent/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/SEO hub/i)).not.toBeInTheDocument();
    expect(container.querySelectorAll("img")).toHaveLength(0);
    expect(
      screen.getByText("All 16 guides", { exact: true }),
    ).toBeInTheDocument();

    const allClasses = Array.from(container.querySelectorAll("[class]"))
      .map((element) => element.getAttribute("class") ?? "")
      .join(" ");

    expect(allClasses).toContain("max-w-3xl");
    expect(allClasses).toContain("border-white/10");
    expect(allClasses).not.toContain("font-black");
    expect(allClasses).not.toContain("rounded-[30px]");
    expect(allClasses).not.toContain("shadow-[");

    const schemaScript = container.querySelector(
      'script[type="application/ld+json"]',
    );
    const schema = JSON.parse(schemaScript?.textContent ?? "{}");
    const itemList = schema["@graph"].find(
      (entry: { "@type": string }) => entry["@type"] === "ItemList",
    );

    expect(itemList.numberOfItems).toBe(16);
    expect(itemList.itemListElement).toHaveLength(16);
  });

  function schemaFor(container: HTMLElement) {
    const script = container.querySelector('script[type="application/ld+json"]');
    const schema = JSON.parse(script?.textContent ?? "{}");
    const node = (type: string) =>
      schema["@graph"].find(
        (entry: { "@type": string }) => entry["@type"] === type,
      );

    return {
      collection: node("CollectionPage"),
      itemList: node("ItemList"),
      breadcrumb: node("BreadcrumbList"),
    };
  }

  it("declares the localized hub in its structured data", () => {
    // The German hub shows German titles. Assigning those titles to English
    // URLs contradicts the localized canonical and the sitemap entries.
    const { container } = render(
      <LearnHubPageContent
        allPages={EN_LEARN_PAGES}
        goals={EN_LEARN_GOALS}
        locale="de"
      />,
      { locale: "de" },
    );

    const { collection, itemList, breadcrumb } = schemaFor(container);
    const hub = "https://thememorychess.com/de/learn";

    expect(collection["@id"]).toBe(`${hub}#webpage`);
    expect(collection.url).toBe(hub);
    expect(collection.inLanguage).toBe("de");
    expect(collection.mainEntity["@id"]).toBe(`${hub}#guides`);

    expect(itemList["@id"]).toBe(`${hub}#guides`);
    for (const entry of itemList.itemListElement) {
      expect(entry.url).toMatch(/^https:\/\/thememorychess\.com\/de\/learn\//);
    }

    expect(breadcrumb.itemListElement.map((e: { item: string }) => e.item)).toEqual([
      "https://thememorychess.com/de",
      hub,
    ]);
  });

  it("keeps the English hub on its unprefixed URLs", () => {
    const { container } = render(
      <LearnHubPageContent
        allPages={EN_LEARN_PAGES}
        goals={EN_LEARN_GOALS}
        locale="en"
      />,
    );

    const { collection, itemList, breadcrumb } = schemaFor(container);

    expect(collection["@id"]).toBe("https://thememorychess.com/learn#webpage");
    expect(collection.url).toBe("https://thememorychess.com/learn");
    expect(collection.inLanguage).toBe("en-US");
    expect(itemList.itemListElement[0].url).toBe(
      `https://thememorychess.com/learn/${EN_LEARN_PAGES[0].slug}`,
    );
    expect(breadcrumb.itemListElement[0].item).toBe("https://thememorychess.com");
  });
});
