import type { ComponentProps } from "react";
import { render } from "@/test-utils/intl";
import LearnArticleRich from "@/components/learn/LearnArticleRich";
import LearnHubPageContent from "@/components/learn/LearnHubPageContent";
import { EN_LEARN_GOALS, EN_LEARN_PAGES } from "@/lib/seo/learn";

/**
 * Swaps every string in a copy object for a unique marker, and every template
 * for one that prints its marker and arguments. Rendering against it proves a
 * string came from the copy module: a hard-coded literal has no marker.
 */
function mockMarkers(value: unknown, keyPath: string): unknown {
  if (typeof value === "function") {
    return (...args: unknown[]) => `«${keyPath}» ${args.join(" ")}`;
  }
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, entry]) => [key, mockMarkers(entry, `${keyPath}.${key}`)]),
    );
  }
  return `«${keyPath}»`;
}

jest.mock("@/lib/seo/learn/copy", () => {
  const actual = jest.requireActual("@/lib/seo/learn/copy");
  return {
    ...actual,
    LEARN_ARTICLE_COPY: mockMarkers(actual.LEARN_ARTICLE_COPY, "LEARN_ARTICLE_COPY"),
    LEARN_HUB_COPY: mockMarkers(actual.LEARN_HUB_COPY, "LEARN_HUB_COPY"),
  };
});

jest.mock("next/link", () => {
  function MockNextLink({ children, href, ...props }: ComponentProps<"a">) {
    return (
      <a href={typeof href === "string" ? href : "#"} {...props}>
        {children}
      </a>
    );
  }

  return MockNextLink;
});

jest.mock("@/components/ui/PageHeader", () => {
  function MockPageHeader() {
    return <div>PageHeader</div>;
  }

  return MockPageHeader;
});

jest.mock("@/components/ui/Footer", () => {
  function MockFooter() {
    return <div>Footer</div>;
  }

  return MockFooter;
});

jest.mock("@/components/learn/LearnArticleTracking", () => {
  function MockLearnArticleTracking() {
    return null;
  }

  return MockLearnArticleTracking;
});

describe("Learn chrome", () => {
  it("renders every piece of article chrome from LEARN_ARTICLE_COPY", () => {
    const page = EN_LEARN_PAGES.find((entry) => entry.slug === "how-to-get-better-at-chess-for-beginners");
    if (!page) throw new Error("guide missing");

    const { container } = render(
      <LearnArticleRich page={page} goals={EN_LEARN_GOALS} allPages={EN_LEARN_PAGES} />,
    );
    const text = container.textContent ?? "";

    for (const key of [
      "breadcrumbHome",
      "breadcrumbLearn",
      "eyebrow",
      "updated",
      "startHere",
      "whatYouWillLearn",
      "whoThisIsFor",
      "browseAllGuides",
      "onThisPage",
      "aimFor",
      "keepLearning",
      "whatToLearnNext",
      "commonQuestions",
      "faqLabel",
      "referenceLinks",
    ]) {
      expect(text).toContain(`«LEARN_ARTICLE_COPY.${key}»`);
    }

    for (const literal of [
      "Simple chess guide",
      "Browse all guides",
      "On this page",
      "What to learn next",
      "Read this guide",
      "Common questions",
      "Reference links",
    ]) {
      expect(text).not.toContain(literal);
    }
  });

  it("renders every piece of hub chrome from LEARN_HUB_COPY", () => {
    const { container } = render(
      <LearnHubPageContent allPages={EN_LEARN_PAGES} goals={EN_LEARN_GOALS} />,
    );
    const text = container.textContent ?? "";

    for (const key of [
      "eyebrow",
      "title",
      "heroDescription",
      "startBeginner",
      "playCta",
      "startHere",
      "pickNext",
      "pickNextDescription",
      "allGuides",
      "chooseGoal",
      "chooseGoalDescription",
      "guideNumber",
      "readRecallPlay",
      "turnIdea",
      "turnIdeaDescription",
      "startRound",
      ...["newToChess", "missingThreats", "losingPosition"].flatMap((id) =>
        ["label", "title", "description"].map((field) => `paths.${id}.${field}`),
      ),
    ]) {
      expect(text).toContain(`«LEARN_HUB_COPY.${key}»`);
    }

    for (const literal of [
      "Learn with Memory Chess",
      "plain English",
      "plain language",
      `All ${EN_LEARN_PAGES.length} guides`,
      "Guide 01",
      "There’s no perfect order",
      "easiest first",
    ]) {
      expect(text).not.toContain(literal);
    }
  });
});
