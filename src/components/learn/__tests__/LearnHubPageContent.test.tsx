import type { ComponentProps } from "react";
import { render, screen } from "@testing-library/react";
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

jest.mock("next/image", () => ({
  __esModule: true,
  default: function MockImage(props: ComponentProps<"img">) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        alt={props.alt}
        src={typeof props.src === "string" ? props.src : ""}
      />
    );
  },
}));

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
  it("uses simple guidance instead of internal SEO language", () => {
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

    const allClasses = Array.from(container.querySelectorAll("[class]"))
      .map((element) => element.getAttribute("class") ?? "")
      .join(" ");
    const fontWeights = allClasses
      .split(/\s+/)
      .filter((className) =>
        /^font-(normal|medium|semibold|bold|extrabold|black)$/.test(className),
      );

    expect(new Set(fontWeights)).toEqual(
      new Set(["font-normal", "font-semibold", "font-bold"]),
    );
    expect(allClasses).not.toContain("font-black");
    expect(allClasses).not.toContain("uppercase");
    expect(allClasses).not.toContain("tracking-[");
  });
});
