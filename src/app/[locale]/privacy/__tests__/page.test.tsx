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
    expect(
      screen.getByText(/draw your streak, personal bests, accuracy trend, miss map, today's board, review queue and forgetting curve on this device\./),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        /Local storage also keeps the UTC day you last opened today's board, so it offers you one try a day, and which review steps you opened, so a board left before its result is not shown twice at one delay\./,
      ),
    ).toBeInTheDocument();
  });

  it("names what analytics receive about rounds and the lab, and what they never receive", () => {
    render(<PrivacyPage />);

    expect(
      screen.getByText(
        /Google Analytics receives an event for each round you finish, on the homepage or in the game, with the number of pieces, the study time, how many pieces you recalled, your accuracy and where the round started, which can name today's board, a review or a plan\. It receives an event when a round starts too, with the number of pieces, the study time and where it started\./,
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        /when the lab section comes into view, when you follow one of its play links, the number of rounds when you download or ask for cross-device backup, and the number of rounds added and skipped when you import\. None of these events carry positions, squares, round ids or streaks\./,
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        /When you start, stop or finish a plan, or set or clear a goal, Google Analytics receives an event that names only that action, with no plan name and no numbers\. The plan and goal you choose are kept in your browser's local storage on this device, as is the number of days a week you aim to play, which sends no event\./,
      ),
    ).toBeInTheDocument();
    expect(screen.queryByText(/never sent to Memory Chess or to analytics/)).not.toBeInTheDocument();
  });

  it("says the reading card goes only to the clipboard and the record note is kept as seen", () => {
    render(<PrivacyPage />);

    expect(
      screen.getByText(
        /Only when you press Copy my reading does your browser put a short text on your clipboard with your memory span, and your pieces held and speed when the record can read them, each with its number of rounds\. It names no positions, squares or dates and is not sent anywhere\./,
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        /Local storage also keeps the time the note about keeping your record in this browser first came into view, so the note is shown once, the time you last saw your notebook, so newer entries are marked as new, and the time you last downloaded the record\. After a few rounds the site asks your browser once to keep the record when space runs low, and local storage notes that it asked\./,
      ),
    ).toBeInTheDocument();
  });

  it("says what a leaderboard standing check keeps on the device and sends, and only on a press", () => {
    render(<PrivacyPage />);

    expect(
      screen.getByText(
        /When you submit a score to the leaderboard, local storage on this device also keeps the id the leaderboard gives that entry, with its difficulty, country, score and the time you sent it, for your best entry on each difficulty\./,
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        /Only when you press Check my standing in the lab record does your browser send that entry id to Memory Chess, with whether to rank it worldwide or within the entry's own country\. Memory Chess reads the entry from the leaderboard and replies with its rank and the number of entries it was ranked against\. The reply is not stored\./,
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        /To limit how often standing can be checked, the server counts checks from each IP address in its memory for one minute, and drops an address at the first check after its minute is up\. If the leaderboard no longer has the entry, its id is removed from this device\. Google Analytics receives an event that says a standing check was made, with no entry id and no rank\./,
      ),
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
