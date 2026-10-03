import { render, screen } from "@/test-utils/intl";
import PrivacyPage from "@/app/[locale]/privacy/page";

jest.mock("@/lib/seo/privacyPolicy", () => ({ PRIVACY_LAST_UPDATED: "2031-01-09T00:00:00.000Z" }));

jest.mock("@/components/ui/PageHeader", () => {
  function MockPageHeader() {
    return <div>Memory Chess header</div>;
  }

  return MockPageHeader;
});

describe("PrivacyPage last-updated line", () => {
  it("prints the shared date, the one the sitemap reads", () => {
    render(<PrivacyPage />);

    expect(screen.getByText("Last updated: January 9, 2031")).toBeInTheDocument();
  });
});
