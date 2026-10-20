import { render, screen } from "@/test-utils/intl";
import { LabFaq } from "@/components/home/LabFaq";
import messages from "../../../../messages/en.json";
import de from "../../../../messages/de.json";

const faqs = messages.home.faq.items;

describe("LabFaq", () => {
  it("answers common player questions in clear language", () => {
    render(<LabFaq />);

    expect(
      screen.getByRole("heading", { name: /Questions about Memory Chess\./ }),
    ).toBeInTheDocument();
    expect(screen.getByText("What is Memory Chess?")).toBeInTheDocument();
    expect(
      screen.getByText("Can beginners play Memory Chess?"),
    ).toBeInTheDocument();
    expect(screen.getByText("Is Memory Chess free?")).toBeInTheDocument();
  });

  it("keeps every answer in the DOM whether its item is open or closed", () => {
    // The Radix accordion once unmounted closed items, so the served HTML carried
    // eight questions and zero answers.
    const { container } = render(<LabFaq />);
    const visible = container.cloneNode(true) as HTMLElement;
    // The FAQPage JSON-LD script also carries the answers, so raw textContent
    // passes even when the accordion unmounts them. Strip scripts to assert on
    // what a reader of the HTML sees.
    visible.querySelectorAll("script").forEach((node) => node.remove());
    const text = visible.textContent ?? "";

    expect(faqs.length).toBe(8);
    for (const faq of faqs) {
      expect(text).toContain(faq.answer);
    }
  });

  it("answers how to play Memory Chess in the page and in its FAQPage data", () => {
    const { container } = render(<LabFaq />);
    const faqPage = JSON.parse(container.querySelector('script[type="application/ld+json"]')?.textContent ?? "{}");
    const answer =
      "Each round has three steps. Pick how many pieces to show and how many seconds to study, or start a preset. Study the position until the time runs out or you press Hide board. The board then clears: choose pieces from the palette and tap the squares where they stood. Submit to see your accuracy, the pieces you placed right and wrong, and how long you took.";

    expect(screen.getByText("How do you play Memory Chess?")).toBeInTheDocument();
    expect(screen.getByText(answer)).toBeInTheDocument();
    expect(faqPage.mainEntity[1]).toEqual({
      "@type": "Question",
      name: "How do you play Memory Chess?",
      acceptedAnswer: { "@type": "Answer", text: answer },
    });
  });

  it("points readers who wanted the wooden board game at its rules", () => {
    render(<LabFaq />);

    expect(screen.getByText(/Looking for the wooden Memory Chess board game\?/)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Read its rules" })).toHaveAttribute(
      "href",
      "/learn/how-to-play-memory-chess-board-game",
    );
  });

  it("marks the rules link as English from a translated home page", () => {
    render(<LabFaq />, { locale: "de", messages: de });

    expect(screen.getByRole("link", { name: "Zu den Spielregeln (English)" })).toHaveAttribute("hrefLang", "en");
  });
});
