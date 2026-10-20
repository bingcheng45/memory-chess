import { readFileSync } from "node:fs";
import path from "node:path";
import { fireEvent, renderWithIntl, screen } from "@/test-utils/intl";
import { LabGameVideo } from "@/components/home/LabGameVideo";
import { gameVideo, type GameVideoConfig } from "@/components/home/gameVideo";
import { LOCALES } from "@/i18n/routing";

const CONFIG: GameVideoConfig = {
  id: "dQw4w9WgXcQ",
  name: "Memory Chess: one round from study to score",
  description: "A full round of Memory Chess.",
  uploadDate: "2026-10-20T09:00:00+08:00",
  duration: "PT20S",
};

function catalogue(locale: string) {
  return JSON.parse(readFileSync(path.join(__dirname, "../../../../messages", `${locale}.json`), "utf8"));
}

describe("gameVideo", () => {
  it("derives the thumbnail, the privacy-friendly embed and the watch URL from the id", () => {
    expect(gameVideo(CONFIG)).toEqual({
      ...CONFIG,
      thumbnailUrl: "https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg",
      embedUrl: "https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ",
      contentUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    });
  });

  it("publishes nothing while the id is empty", () => {
    expect(gameVideo({ ...CONFIG, id: "", uploadDate: "", duration: "" })).toBeNull();
  });

  it.each([
    ["id", { id: "not an id" }],
    ["uploadDate", { uploadDate: "" }],
    ["duration", { duration: "20 seconds" }],
  ])("refuses a set id with a malformed %s", (field, patch) => {
    expect(() => gameVideo({ ...CONFIG, ...patch })).toThrow(field);
  });
});

describe("LabGameVideo", () => {
  it("renders no player, thumbnail or caption when no video is published", () => {
    const { container } = renderWithIntl(<LabGameVideo video={gameVideo({ ...CONFIG, id: "" })} />);

    expect(container.innerHTML).toBe("");
  });

  it("shows the YouTube thumbnail behind a play button and loads no iframe until it is clicked", () => {
    const { container } = renderWithIntl(<LabGameVideo video={gameVideo(CONFIG)} />);

    const play = screen.getByRole("button", { name: `Play video: ${CONFIG.name}` });
    expect(container.querySelector("iframe")).toBeNull();
    expect(container.querySelector("img")?.getAttribute("src")).toBe("https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg");
    expect(container.querySelector("figcaption")?.textContent).toBe(
      "One round, start to finish: study the position, rebuild it from memory, read your score.",
    );

    fireEvent.click(play);

    const iframe = container.querySelector("iframe");
    expect(iframe?.getAttribute("src")).toBe("https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ?autoplay=1&playsinline=1&rel=0");
    expect(iframe?.getAttribute("title")).toBe(`YouTube video: ${CONFIG.name}`);
    expect(document.activeElement).toBe(iframe);
    expect(screen.queryByRole("button", { name: `Play video: ${CONFIG.name}` })).toBeNull();
  });

  it.each(LOCALES)("names the video in the %s play button", (locale) => {
    renderWithIntl(<LabGameVideo video={gameVideo(CONFIG)} />, { locale, messages: catalogue(locale) });

    expect(screen.getByRole("button").getAttribute("aria-label")).toContain(CONFIG.name);
  });
});
