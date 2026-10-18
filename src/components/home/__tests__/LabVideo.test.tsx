import { readFileSync } from "node:fs";
import path from "node:path";
import { render, screen } from "@/test-utils/intl";
import { LabVideo } from "@/components/home/LabVideo";
import { LOCALES } from "@/i18n/routing";

const YOUTUBE_TITLE = "How to Train Yourself to Visualize Anything (6 Simple Tips & Habits)";

function catalogue(locale: string) {
  return JSON.parse(readFileSync(path.join(__dirname, "../../../../messages", `${locale}.json`), "utf8"));
}

describe("LabVideo", () => {
  it("introduces the video as a talk on visualization and credits it by its YouTube title", () => {
    const { container } = render(<LabVideo />);

    expect(screen.getByRole("heading", { name: "Train the skill the game uses." })).toBeInTheDocument();
    expect(
      screen.getByText("A short video by Colin Galen on visualization, the skill every round trains."),
    ).toBeInTheDocument();
    expect(container.querySelector("figcaption")?.textContent).toBe(`Video: “${YOUTUBE_TITLE}” by Colin Galen`);
    expect(container.querySelector("iframe")?.getAttribute("title")).toBe(`YouTube video: ${YOUTUBE_TITLE}`);
  });

  it.each(LOCALES)("names the video by its YouTube title in the %s caption and player", (locale) => {
    const { container } = render(<LabVideo />, { locale, messages: catalogue(locale) });

    expect(container.querySelector("figcaption")?.textContent).toContain(YOUTUBE_TITLE);
    expect(container.querySelector("iframe")?.getAttribute("title")).toContain(YOUTUBE_TITLE);
  });
});
