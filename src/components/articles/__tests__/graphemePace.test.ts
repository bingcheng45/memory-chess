import { graphemeEnds, typingRateFor } from "@/components/articles/typingPace";

const HINDI_SENTENCE = "मैग्नस कार्लसन ने शतरंज की बिसात को बिना देखे दस खेल खेले।";
const HINDI_SURNAME = "कार्लसन";

function segmentsOf(text: string): string[] {
  return Array.from(new Intl.Segmenter(undefined, { granularity: "grapheme" }).segment(text), (part) => part.segment);
}

function cutAt(text: string, ends: readonly number[]): string[] {
  return ends.map((end, index) => text.slice(index === 0 ? 0 : ends[index - 1], end));
}

describe("graphemeEnds", () => {
  it("returns no offsets for an empty text", () => {
    expect(graphemeEnds("")).toEqual([]);
  });

  it("ends after every letter of plain text", () => {
    expect(graphemeEnds("abc")).toEqual([1, 2, 3]);
  });

  it("cuts a Hindi sentence into the same whole clusters Intl.Segmenter finds", () => {
    const ends = graphemeEnds(HINDI_SENTENCE);

    expect(cutAt(HINDI_SENTENCE, ends)).toEqual(segmentsOf(HINDI_SENTENCE));
    expect(ends.at(-1)).toBe(HINDI_SENTENCE.length);
  });

  it("leaves both halves of every cut in the Hindi sentence ending and starting on a whole cluster", () => {
    const wholeSentence = segmentsOf(HINDI_SENTENCE);

    for (const end of graphemeEnds(HINDI_SENTENCE)) {
      const head = segmentsOf(HINDI_SENTENCE.slice(0, end));
      const tail = segmentsOf(HINDI_SENTENCE.slice(end));
      expect([...head, ...tail]).toEqual(wholeSentence);
    }
  });

  it("never cuts the surname Carlsen between its r and l", () => {
    const conjunctStart = HINDI_SENTENCE.indexOf(HINDI_SURNAME) + 2;
    const conjunctEnd = conjunctStart + "र्ल".length;
    const insideConjunct = graphemeEnds(HINDI_SENTENCE).filter((end) => end > conjunctStart && end < conjunctEnd);

    expect(insideConjunct).toEqual([]);
    expect(graphemeEnds(HINDI_SURNAME)).toEqual([2, 5, 6, 7]);
  });

  it("keeps an emoji and its skin-tone modifier together", () => {
    const thumbsUp = String.fromCodePoint(0x1f44d, 0x1f3fd);

    expect(graphemeEnds(`a${thumbsUp}b`)).toEqual([1, 5, 6]);
  });

  it("keeps a letter and its combining acute accent together", () => {
    const acute = String.fromCharCode(0x301);

    expect(graphemeEnds(`xe${acute}y`)).toEqual([1, 3, 4]);
  });

  describe("without Intl.Segmenter", () => {
    const segmenter = Intl.Segmenter;

    beforeEach(() => {
      Object.defineProperty(Intl, "Segmenter", { value: undefined, configurable: true, writable: true });
    });

    afterEach(() => {
      Object.defineProperty(Intl, "Segmenter", { value: segmenter, configurable: true, writable: true });
    });

    it("cuts after each code point and keeps a surrogate pair whole", () => {
      const clef = String.fromCodePoint(0x1d11e);

      expect(graphemeEnds(`ab${clef}cd`)).toEqual([1, 2, 4, 5, 6]);
    });

    it("falls back to code points for a combining accent", () => {
      const acute = String.fromCharCode(0x301);

      expect(graphemeEnds(`e${acute}`)).toEqual([1, 2]);
    });

    it("returns no offsets for an empty text", () => {
      expect(graphemeEnds("")).toEqual([]);
    });
  });
});

describe("typingRateFor", () => {
  const english = [
    { heading: "Heading", paragraphs: ["abcdefghij", "klmnopqrst"] },
    { heading: "More", paragraphs: ["uvwxyz"] },
  ];

  it("is 150 characters a second for the same sections", () => {
    expect(typingRateFor(english, english)).toBe(150);
  });

  it("answers for the same array without segmenting any text", () => {
    const segmenter = jest.spyOn(Intl, "Segmenter");

    expect(typingRateFor(english, english)).toBe(150);
    expect(segmenter).not.toHaveBeenCalled();

    segmenter.mockRestore();
  });

  it("is 150 for a translation with as many graphemes, whatever the words", () => {
    const german = [
      { heading: "Kopfzei", paragraphs: ["0123456789", "9876543210"] },
      { heading: "Mehr", paragraphs: ["abcdef"] },
    ];

    expect(typingRateFor(english, german)).toBe(150);
  });

  it("is 75 for a body with half as many graphemes", () => {
    const sixty = [{ heading: "H".repeat(10), paragraphs: ["p".repeat(20)] }];
    const thirty = [{ heading: "H".repeat(5), paragraphs: ["p".repeat(10)] }];

    expect(typingRateFor(sixty, thirty)).toBe(75);
  });

  it("is 300 for a body twice as long, so it still takes as long to type", () => {
    const thirty = [{ heading: "H".repeat(5), paragraphs: ["p".repeat(25)] }];
    const sixty = [{ heading: "H".repeat(10), paragraphs: ["p".repeat(50)] }];

    expect(typingRateFor(thirty, sixty)).toBe(300);
  });

  it("counts a Devanagari conjunct as one grapheme", () => {
    const latin = [{ heading: "abcd", paragraphs: [] }];
    const hindi = [{ heading: HINDI_SURNAME, paragraphs: [] }];

    expect(typingRateFor(latin, hindi)).toBe(150);
  });

  it("is 150 when the English body is empty", () => {
    expect(typingRateFor([], english)).toBe(150);
    expect(typingRateFor([{ heading: "", paragraphs: [] }], english)).toBe(150);
  });

  it("is 150 when the translated body is empty", () => {
    expect(typingRateFor(english, [])).toBe(150);
  });
});
