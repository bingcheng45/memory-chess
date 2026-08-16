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
jest.mock("@/components/ui/button", () => ({
  Button: function MockButton({
    children,
    asChild,
    ...props
  }: ComponentProps<"button"> & { asChild?: boolean }) {
    if (asChild) {
      return <>{children}</>;
    }

    return (
      <button type="button" {...props}>
        {children}
      </button>
    );
  },
}));

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
