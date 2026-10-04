import { createTranslator } from "next-intl";
import messages from "../../../../messages/en.json";

const { list, meta } = messages.articles;

describe("the list page copy in the English catalogue", () => {
  it("promises no publishing schedule, since the section has no track record yet", () => {
    const strings = [...Object.values(list), ...Object.values(meta)];

    expect(strings).toContain("How these articles are made");
    for (const text of strings) expect(text).not.toMatch(/\bweek/i);
  });

  it("says how the translations are made, at the end of its last paragraph", () => {
    expect(
      list.about3.endsWith(
        " Articles in other languages are translated from the English text with AI assistance, and each translation is checked before it goes up.",
      ),
    ).toBe(true);
  });

  it("asks for corrections in one sentence that the link completes", () => {
    const t = createTranslator({ locale: "en", messages, namespace: "articles.list" });

    expect(t.markup("corrections", { link: (label) => `[${label}]` })).toBe(
      "If something here is wrong, [send a correction].",
    );
  });
});
