import { render, screen } from "@testing-library/react";
import PrivacyPage from "@/app/privacy/page";

jest.mock("@/components/ui/PageHeader", () => {
  function MockPageHeader() {
    return <div>Memory Chess header</div>;
  }

  return MockPageHeader;
});

jest.mock("@/components/ui/Footer", () => {
  function MockFooter() {
    return <div>Privacy footer</div>;
  }

  return MockFooter;
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
    expect(screen.getByText("Privacy footer")).toBeInTheDocument();
  });
});
