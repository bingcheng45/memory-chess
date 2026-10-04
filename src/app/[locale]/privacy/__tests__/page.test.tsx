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

  it("says what article likes and views keep in the browser and in Supabase", () => {
    render(<PrivacyPage />);

    expect(
      screen.getByText(
        /saves the id of that article and the like count shown at that moment in the local storage of your browser/,
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Session storage remembers which articles you opened/),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        /only a total of views and a total of likes for each article, with the time of the last change and no visitor identifier/,
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Google Analytics also receives a like event that names the article/),
    ).toBeInTheDocument();
  });

  it("claims no identifier the site does not create", () => {
    render(<PrivacyPage />);

    expect(screen.getByText(/Clearing your browser data resets these choices/)).toBeInTheDocument();
    expect(screen.queryByText(/local identifier/)).not.toBeInTheDocument();
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
