import { render, screen } from "@/test-utils/intl";
import TermsPage from "@/app/[locale]/terms/page";

jest.mock("@/components/ui/PageHeader", () => {
  function MockPageHeader() {
    return <div>Memory Chess header</div>;
  }

  return MockPageHeader;
});

jest.mock("@/components/ui/Footer", () => {
  function MockFooter() {
    return <div>Terms footer</div>;
  }

  return MockFooter;
});

describe("TermsPage", () => {
  it("states the deal plainly and links the privacy policy", () => {
    render(<TermsPage />);

    expect(
      screen.getByRole("heading", { name: "Terms of Service", level: 1 }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "The leaderboard" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "bingcheng45@gmail.com" }),
    ).toHaveAttribute("href", "mailto:bingcheng45@gmail.com");
    expect(
      screen.getByRole("link", { name: "privacy policy" }),
    ).toHaveAttribute("href", "/privacy");
    expect(screen.getByText("Terms footer")).toBeInTheDocument();
  });
});
