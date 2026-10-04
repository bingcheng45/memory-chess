import { screen } from "@testing-library/react";
import TypedBody from "@/components/articles/TypedBody";
import { announceArrival } from "@/components/articles/articleArrival";
import { graphemeEnds } from "@/components/articles/typingPace";
import {
  FRAME_MS,
  LONGER_THAN_THE_WHOLE_BODY_MS,
  SLUG,
  body,
  phase,
  renderBody,
  typeFor,
  withFakeFrames,
} from "@/components/articles/__tests__/typedBodyHarness";
import { renderWithIntl } from "@/test-utils/intl";
import englishMessages from "../../../../messages/en.json";

const HINDI_HEADING = "बिना देखे शतरंज";
const HINDI_SENTENCE = "मैग्नस कार्लसन ने शतरंज की बिसात को बिना देखे दस खेल खेले।";
const HINDI_SECTIONS = [{ heading: HINDI_HEADING, paragraphs: [HINDI_SENTENCE] }];
const LONG_HEADING = [{ heading: "x".repeat(400), paragraphs: [] }];
const GERMAN_LABEL = "Ganzen Text zeigen";
const SANS_CLASS = "[font-family:var(--font-geist-sans)]";

const germanMessages = {
  ...englishMessages,
  articles: {
    ...englishMessages.articles,
    page: { ...englishMessages.articles.page, showAll: GERMAN_LABEL },
  },
};

function typedPrefix(): string {
  return body().querySelector(".article-caret")?.previousElementSibling?.textContent ?? "";
}

withFakeFrames();

describe("TypedBody for a locale other than English", () => {
  beforeEach(() => {
    announceArrival(SLUG, Promise.resolve());
  });

  it("shows only whole Devanagari clusters after every frame of a typed paragraph", async () => {
    renderWithIntl(<TypedBody slug={SLUG} sections={HINDI_SECTIONS} />, { locale: "hi" });
    const blocks = [HINDI_HEADING, HINDI_SENTENCE];
    const seenPrefixes = new Set<string>();

    await typeFor(LONGER_THAN_THE_WHOLE_BODY_MS, () => {
      const prefix = typedPrefix();
      if (prefix === "") return;
      const block = blocks.find((text) => text.startsWith(prefix));
      expect(block).toBeDefined();
      expect(graphemeEnds(block!)).toContain(prefix.length);
      seenPrefixes.add(prefix);
    });

    expect(seenPrefixes.size).toBeGreaterThan(10);
    expect(phase()).toBe("done");
    expect(body().textContent).toBe(`${HINDI_HEADING}${HINDI_SENTENCE}`);
  });

  it("labels the Show all text button from the message catalogue", async () => {
    renderBody({ locale: "de", messages: germanMessages });

    await typeFor(100);

    expect(screen.getByRole("button", { name: GERMAN_LABEL })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Show all text" })).not.toBeInTheDocument();
  });

  it("reads Hindi in the site sans stack and English in the reading face", () => {
    const hindi = renderWithIntl(<TypedBody slug={SLUG} sections={HINDI_SECTIONS} />, { locale: "hi" });
    expect(body().className).toContain(SANS_CLASS);
    hindi.unmount();

    renderBody();
    expect(body().className).not.toContain(SANS_CLASS);
  });

  it("types at the rate it is given", async () => {
    const quarterRate = renderWithIntl(<TypedBody slug={SLUG} sections={LONG_HEADING} charsPerSecond={37.5} />);
    await typeFor(20 * FRAME_MS);
    const typedAtQuarterRate = typedPrefix().length;
    quarterRate.unmount();

    announceArrival(SLUG, Promise.resolve());
    renderWithIntl(<TypedBody slug={SLUG} sections={LONG_HEADING} />);
    await typeFor(20 * FRAME_MS);

    expect(typedAtQuarterRate).toBe(10);
    expect(typedPrefix().length).toBe(43);
  });
});
