import { render, screen } from "@/test-utils/intl";
import PrivacyPage from "@/app/[locale]/privacy/page";

jest.mock("@/components/ui/PageHeader", () => {
  function MockPageHeader() {
    return <div>Memory Chess header</div>;
  }

  return MockPageHeader;
});

describe("PrivacyPage", () => {
  it("explains data use, cookies, advertising, and user choices", () => {
    render(<PrivacyPage />);

    expect(
      screen.getByRole("heading", { name: "Privacy Policy" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Advertising and Google AdSense" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Cookies and browser storage" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", {
        name: "how Google uses information from partner sites",
      }),
    ).toHaveAttribute(
      "href",
      "https://policies.google.com/technologies/partner-sites",
    );
    expect(
      screen.getByRole("link", { name: "Memory Chess contact form" }),
    ).toHaveAttribute("href", "/contact-us");
  });

  it("names the controller, the DART cookie, and GDPR and CCPA rights", () => {
    render(<PrivacyPage />);

    expect(
      screen.getByRole("heading", { name: "Who is responsible for your data" }),
    ).toBeInTheDocument();
    expect(screen.getByText(/Bing Cheng/)).toBeInTheDocument();
    expect(
      screen.getAllByRole("link", { name: "bingcheng45@gmail.com" }).length,
    ).toBeGreaterThan(0);
    expect(screen.getByText(/DoubleClick/)).toBeInTheDocument();
    expect(screen.getByText(/DART cookie/)).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Your rights under GDPR and CCPA" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        /access, rectification, erasure, restriction of processing, objection to processing, and data portability/,
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Do Not Sell or Share My Personal Information/),
    ).toBeInTheDocument();
  });
});
