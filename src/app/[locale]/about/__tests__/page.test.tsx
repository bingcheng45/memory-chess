import { render, screen } from "@/test-utils/intl";
import AboutPage from "@/app/[locale]/about/page";

jest.mock("@/components/ui/PageHeader", () => {
  function MockPageHeader() {
    return <div>Memory Chess header</div>;
  }

  return MockPageHeader;
});

describe("AboutPage", () => {
  it("names the developer and links the site's real pages", () => {
    render(<AboutPage />);

    expect(
      screen.getByRole("heading", { name: "About Memory Chess", level: 1 }),
    ).toBeInTheDocument();
    expect(screen.getByText(/Bing Cheng/)).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "bingcheng45@gmail.com" }),
    ).toHaveAttribute("href", "mailto:bingcheng45@gmail.com");
    expect(screen.getByRole("link", { name: "Learn library" })).toHaveAttribute(
      "href",
      "/learn",
    );
    expect(
      screen.getByRole("link", { name: "privacy policy" }),
    ).toHaveAttribute("href", "/privacy");
    expect(
      screen.getByRole("link", { name: "terms of service" }),
    ).toHaveAttribute("href", "/terms");
  });
});
