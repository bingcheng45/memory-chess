import { render, screen, fireEvent, within } from "@/test-utils/intl";
import SettingsPage from "@/app/[locale]/settings/page";
import { useSettingsStore } from "@/stores/settingsStore";

jest.mock("next/navigation", () => ({
  ...jest.requireActual("next/navigation"),
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
    back: jest.fn(),
  }),
  usePathname: () => "/settings",
  useParams: () => ({ locale: "en" }),
}));

const coordinatesSwitch = () => screen.getByRole("switch", { name: "Show board coordinates" });

describe("SettingsPage", () => {
  beforeEach(() => {
    useSettingsStore.setState({ showCoordinates: true });
    window.localStorage.clear();
  });

  it("offers the coordinates switch with its explanation, and no removed difficulty or time controls", () => {
    render(<SettingsPage />);

    expect(screen.getByRole("heading", { level: 1, name: "Settings" })).toBeInTheDocument();
    expect(coordinatesSwitch()).toHaveAccessibleDescription(
      "Letters and numbers along the edges of the board while you memorize and place pieces. The result screen always shows them.",
    );
    expect(screen.queryByText(/difficulty/i)).not.toBeInTheDocument();
    expect(screen.queryByRole("slider")).not.toBeInTheDocument();
  });

  it("links to the game and home", () => {
    render(<SettingsPage />);
    const main = screen.getByRole("main");

    expect(within(main).getByRole("link", { name: "Play a round" })).toHaveAttribute("href", "/game");
    expect(within(main).getByRole("link", { name: "Home" })).toHaveAttribute("href", "/");
  });

  it("turns coordinates off, saves it in the browser and says so", () => {
    render(<SettingsPage />);

    expect(coordinatesSwitch()).toHaveAttribute("aria-checked", "true");
    expect(screen.getByRole("status")).toHaveTextContent("");

    fireEvent.click(coordinatesSwitch());

    expect(coordinatesSwitch()).toHaveAttribute("aria-checked", "false");
    expect(useSettingsStore.getState().showCoordinates).toBe(false);
    expect(JSON.parse(window.localStorage.getItem("memory-chess-settings") ?? "{}").state).toMatchObject({ showCoordinates: false });
    expect(screen.getByRole("status")).toHaveTextContent("Saved. The board will hide its coordinates.");

    fireEvent.click(coordinatesSwitch());

    expect(screen.getByRole("status")).toHaveTextContent("Saved. The board will show its coordinates.");
  });
});
