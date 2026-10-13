import { render, screen } from "@/test-utils/intl";
import { LabFaq } from "@/components/home/LabFaq";
import messages from "../../../../messages/en.json";

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
});
