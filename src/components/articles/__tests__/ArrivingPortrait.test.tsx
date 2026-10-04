import { StrictMode } from "react";
import { render, screen } from "@testing-library/react";
import ArrivingPortrait from "@/components/articles/ArrivingPortrait";
import { announceArrival, clearArrival } from "@/components/articles/articleArrival";
import { SLUG } from "@/components/articles/__tests__/flightHarness";
import { photoNamed } from "@/components/articles/__tests__/warmedImages";

const CARD_FILE = "http://localhost/_next/image?url=%2Fimages%2Farticles%2Falder.jpg&w=256&q=75";
const UNOPTIMIZED_FILE = "http://localhost/images/articles/alder.jpg";
const photo = photoNamed("alder");

const portrait = () => screen.getByRole("img", { name: photo.alt });

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

    expect(portrait().style.backgroundImage).toBe(`url("${file}")`);
    expect(portrait().style.backgroundSize).toBe("cover");
    expect(portrait().style.backgroundPosition).toBe("center");
  });

  it("stays the named element of the flight, so the placeholder flies with it", () => {
    arriveWith(CARD_FILE);

    expect(portrait()).toHaveAttribute("data-flight", "portrait");
    expect(portrait().style.backgroundImage).toBe(`url("${CARD_FILE}")`);
  });

  it("keeps the placeholder once the arrival is cleared, since the full file may still be on its way", () => {
    const { rerender } = arriveWith(CARD_FILE);

    clearArrival();
    rerender(<ArrivingPortrait slug={SLUG} photo={photo} />);

    expect(portrait().style.backgroundImage).toBe(`url("${CARD_FILE}")`);
  });

  it("paints the placeholder under React StrictMode too", () => {
    announceArrival(SLUG, Promise.resolve(), CARD_FILE);

    render(
      <StrictMode>
        <ArrivingPortrait slug={SLUG} photo={photo} />
      </StrictMode>,
    );

    expect(portrait().style.backgroundImage).toBe(`url("${CARD_FILE}")`);
  });

  it("escapes a backslash, so the file name cannot end the CSS string early", () => {
    arriveWith("http://localhost/_next/image?url=a\\");

    expect(portrait().getAttribute("style")).toContain('url("http://localhost/_next/image?url=a\\\\")');
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
