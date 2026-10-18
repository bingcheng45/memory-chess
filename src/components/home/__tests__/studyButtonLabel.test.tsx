import { readFileSync } from "node:fs";
import path from "node:path";
import { render } from "@/test-utils/intl";
import { LabFaq } from "@/components/home/LabFaq";
import { LOCALES } from "@/i18n/routing";
import { getReferenceProse } from "@/lib/reference/prose";

function catalogue(locale: string) {
  return JSON.parse(readFileSync(path.join(__dirname, "../../../../messages", `${locale}.json`), "utf8"));
}

describe.each(LOCALES)("%s names the study button by its on-screen label", (locale) => {
  const messages = catalogue(locale);
  const button: string = messages.game.round.hide;

  it("in the how-to-play FAQ answer and its FAQPage data", () => {
    const { container } = render(<LabFaq />, { locale, messages });
    const faqPage = JSON.parse(container.querySelector('script[type="application/ld+json"]')?.textContent ?? "{}");

    expect(messages.home.faq.items[1].answer).toContain(button);
    expect(faqPage.mainEntity[1].acceptedAnswer.text).toBe(messages.home.faq.items[1].answer);
  });

  it("in the reference text for the memorize phase", () => {
    expect(getReferenceProse(locale).game.phases.memorize.body).toContain(button);
  });
});
