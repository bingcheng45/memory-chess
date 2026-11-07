import { renderWithIntl, screen } from "@/test-utils/intl";
import { IntroFirstScreen } from "@/components/home/intro/IntroFirstScreen";
import { QUICK_START_HREF } from "@/components/home/links";
import de from "../../../../../messages/de.json";

let mockHomeIntro = false;
jest.mock("@/lib/home/intro/introGate", () => ({
  ...jest.requireActual("@/lib/home/intro/introGate"),
  get HOME_INTRO() {
    return mockHomeIntro;
  },
}));

beforeEach(() => {
  mockHomeIntro = false;
});

describe("IntroFirstScreen", () => {
  it("shows an English phone the section, fifteen boards and Play", () => {
    const { container } = renderWithIntl(<IntroFirstScreen />);

    expect(screen.getByRole("region", { name: "Najdorf's 45 boards" })).toBeInTheDocument();
    expect(container.querySelectorAll("svg.home-first-board")).toHaveLength(15);
    expect(screen.getByRole("link", { name: "Play a free round" })).toHaveAttribute("href", QUICK_START_HREF);
  });

  it("renders nothing for a language without the first screen", () => {
    const { container } = renderWithIntl(<IntroFirstScreen />, { locale: "de", messages: de });

    expect(container).toBeEmptyDOMElement();
  });

  it("links the story to Najdorf's article while the intro is off", () => {
    renderWithIntl(<IntroFirstScreen />);

    expect(screen.getByRole("link", { name: "Read Najdorf's story" })).toHaveAttribute("href", "/articles/miguel-najdorf");
    expect(screen.queryByRole("button", { name: "Read Najdorf's story" })).not.toBeInTheDocument();
  });

  it("makes the story a button that replays the intro while the intro is on", () => {
    mockHomeIntro = true;
    renderWithIntl(<IntroFirstScreen />);

    expect(screen.getByRole("button", { name: "Read Najdorf's story" })).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Read Najdorf's story" })).not.toBeInTheDocument();
  });
});
