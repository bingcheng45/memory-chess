import { StrictMode } from "react";
import { render, screen } from "@testing-library/react";
import ArrivingPortrait from "@/components/articles/ArrivingPortrait";
import { announceArrival, clearArrival } from "@/components/articles/articleArrival";
import { warmArticlePortrait } from "@/components/articles/portraitWarmUp";
import { CARD_FILE, SLUG, photoNamed } from "@/components/articles/__tests__/flightHarness";
import { recordWarmedImages } from "@/components/articles/__tests__/warmedImages";

const UNOPTIMIZED_FILE = "http://localhost/images/articles/alder.jpg";
const photo = photoNamed("alder");
// jsdom prints a url() value without the quotes the component writes.
const paintedAs = (file: string) => `url(${file})`;

const warmed = recordWarmedImages();
const portrait = () => screen.getByRole<HTMLImageElement>("img", { name: photo.alt });

function arriveWith(portraitSrc: string | null) {
  announceArrival(SLUG, Promise.resolve(), portraitSrc);
  return render(<ArrivingPortrait slug={SLUG} photo={photo} />);
}

afterEach(clearArrival);

describe("ArrivingPortrait after a card click", () => {
  it.each([
    ["the optimizer's file", CARD_FILE],
    ["the photo's own file", UNOPTIMIZED_FILE],
  ])("paints %s the card was showing behind the portrait, covering its box", (_name, file) => {
    arriveWith(file);

    expect(portrait().style.backgroundImage).toBe(paintedAs(file));
    expect(portrait().style.backgroundSize).toBe("cover");
    expect(portrait().style.backgroundPosition).toBe("center");
  });

  it("keeps the placeholder once the arrival is cleared, since the full file may still be on its way", () => {
    const { rerender } = arriveWith(CARD_FILE);

    clearArrival();
    rerender(<ArrivingPortrait slug={SLUG} photo={photo} />);

    expect(portrait().style.backgroundImage).toBe(paintedAs(CARD_FILE));
  });

  it("paints the placeholder under React StrictMode too", () => {
    announceArrival(SLUG, Promise.resolve(), CARD_FILE);

    render(
      <StrictMode>
        <ArrivingPortrait slug={SLUG} photo={photo} />
      </StrictMode>,
    );

    expect(portrait().style.backgroundImage).toBe(paintedAs(CARD_FILE));
  });

  it("escapes a backslash, so the file name cannot end the CSS string early", () => {
    arriveWith("http://localhost/_next/image?url=a\\");

    expect(portrait().style.backgroundImage).toBe("url(http://localhost/_next/image?url=a\\\\)");
  });
});

describe("ArrivingPortrait with nothing safe to paint", () => {
  it.each([
    ["no file", null],
    ["a file from another origin", "https://example.com/_next/image?url=%2Fimages%2Farticles%2Falder.jpg&w=256&q=75"],
    ["a file from another port", "http://localhost:8080/_next/image?url=%2Fimages%2Farticles%2Falder.jpg&w=256&q=75"],
    ["a path that holds no portrait", "http://localhost/api/articles/alder-fixture/stats"],
    ["a path that only starts like the optimizer's", "http://localhost/_next/imagery"],
    ["a script address", "javascript:alert(1)"],
    ["a data address", "data:image/png;base64,AAAA"],
    ["text that is no address", "http://["],
  ])("paints no background for %s", (_name, portraitSrc) => {
    arriveWith(portraitSrc);

    expect(portrait().style.backgroundImage).toBe("");
    expect(portrait().getAttribute("style")).not.toContain("background");
  });

  it("paints no background on a direct load, where nothing was announced", () => {
    render(<ArrivingPortrait slug={SLUG} photo={photo} />);

    expect(portrait().style.backgroundImage).toBe("");
  });

  it("paints no background for an arrival at another article", () => {
    announceArrival("birch-fixture", Promise.resolve(), CARD_FILE);

    render(<ArrivingPortrait slug={SLUG} photo={photo} />);

    expect(portrait().style.backgroundImage).toBe("");
  });
});

describe("ArrivingPortrait and the warm-up", () => {
  it("asks for the candidates the warm-up asked for, so the browser reuses the warmed file", () => {
    render(<ArrivingPortrait slug={SLUG} photo={photo} />);

    warmArticlePortrait(photo);

    expect(warmed).toHaveLength(1);
    expect(warmed[0].sizes).toBe(portrait().sizes);
    expect(warmed[0].srcset).toBe(portrait().srcset);
    expect(portrait().srcset).toContain("/_next/image?url=%2Fimages%2Farticles%2Falder.jpg&w=384&q=75 384w");
  });
});
