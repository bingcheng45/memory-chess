import { ARTICLE_LIST_COPY } from "@/lib/articles/copy";

describe("the list page copy", () => {
  it("promises no publishing schedule, since the section has no track record yet", () => {
    expect(JSON.stringify(ARTICLE_LIST_COPY)).not.toMatch(/\bweek/i);
  });

  it("asks for corrections in a clause the link completes", () => {
    const { text, linkLabel } = ARTICLE_LIST_COPY.about.corrections;

    expect(`${text} ${linkLabel}.`).toBe("If something here is wrong, send a correction.");
  });
});
