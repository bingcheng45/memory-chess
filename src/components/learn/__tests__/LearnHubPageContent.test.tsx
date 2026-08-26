import type { ComponentProps } from "react";
import { render, screen } from "@/test-utils/intl";
import LearnHubPageContent from "@/components/learn/LearnHubPageContent";

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
    const { container } = render(<LearnHubPageContent />);

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
});
