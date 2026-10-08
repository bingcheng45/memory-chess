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

  it("lists every fact the lab record keeps and says the record itself never leaves the device", () => {
    render(<PrivacyPage />);

    expect(
      screen.getByText(
        /the position you studied, the one you rebuilt, your timings, your scores, your time zone offset, where you started the round \(such as the homepage or a guide\), and the order and timing of each piece you placed\./,
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        /The record itself, with its positions, squares, placements and history, never leaves this device\./,
      ),
    ).toBeInTheDocument();
  });

  it("names what analytics receive about rounds and the lab, and what they never receive", () => {
    render(<PrivacyPage />);

    expect(
      screen.getByText(
        /Google Analytics receives an event for each round you finish, on the homepage or in the game, with the number of pieces, the study time, how many pieces you recalled, your accuracy and where the round started\./,
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        /when the lab section comes into view, when you follow one of its play links, and the number of rounds when you download, import, or ask for cross-device backup\. None of these events carry positions, squares, round ids or streaks\./,
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        /When you start, stop or finish a plan, or set or clear a goal, Google Analytics receives an event that names only that action, with no plan name and no numbers\. The plan and goal you choose are kept in your browser's local storage on this device\./,
      ),
    ).toBeInTheDocument();
    expect(screen.queryByText(/never sent to Memory Chess or to analytics/)).not.toBeInTheDocument();
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
