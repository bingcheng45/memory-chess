import { render, screen, fireEvent } from "@/test-utils/intl";
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

describe("SettingsPage", () => {
  beforeEach(() => {
    useSettingsStore.setState({ showCoordinates: true });
  });

  it("renders only the coordinates control, not the removed difficulty or time controls", () => {
    render(<SettingsPage />);

    expect(
      screen.getByRole("checkbox", { name: /show board coordinates/i }),
    ).toBeInTheDocument();
    expect(screen.queryByText(/difficulty/i)).not.toBeInTheDocument();
    expect(screen.queryByRole("slider")).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /^(easy|medium|hard)$/i }),
    ).not.toBeInTheDocument();
  });

  it("still renders the Home and Play Game links", () => {
    render(<SettingsPage />);

    expect(screen.getByRole("link", { name: "Home" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Play Game" })).toBeInTheDocument();
  });

  it("toggling the coordinates checkbox updates the store", () => {
    render(<SettingsPage />);
    const checkbox = screen.getByRole("checkbox", { name: /show board coordinates/i });

    expect(checkbox).toBeChecked();
    fireEvent.click(checkbox);

    expect(useSettingsStore.getState().showCoordinates).toBe(false);
    expect(checkbox).not.toBeChecked();
  });
});
