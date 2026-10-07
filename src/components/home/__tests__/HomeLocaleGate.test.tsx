import Home from "@/app/[locale]/page";
import { renderWithIntl, screen } from "@/test-utils/intl";
import german from "../../../../messages/de.json";
import japanese from "../../../../messages/ja.json";

jest.mock("@/components/ui/PageHeader", () => {
  function MockPageHeader() {
    return <div>Memory Chess header</div>;
  }

  return MockPageHeader;
});

beforeEach(() => {
  global.fetch = jest.fn(() => Promise.resolve({ ok: false } as Response));
});

describe("homepage locale gate", () => {
  it("serves the Brain Lab to English", async () => {
    const { container } = renderWithIntl(<Home />);

    expect(container.querySelector(".lab")).not.toBeNull();
    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
      "Memory chess game · chess memory trainer Put a number on your mind's eye.",
    );
    expect(screen.getAllByText("Take a calibration reading").length).toBeGreaterThan(0);
    // jsdom has no IndexedDB, which the record reads as a window that cannot keep it.
    expect(await screen.findByText(/Not saved in private windows/)).toBeInTheDocument();
  });

  it.each([
    ["de", german],
    ["ja", japanese],
  ])("serves the earlier homepage to %s with its own copy and no lab text", async (locale, messages) => {
    const { container } = renderWithIntl(<Home />, { locale, messages });

    expect(await screen.findByRole("heading", { level: 1 })).toHaveTextContent(messages.home.hero.title);
    expect(container.querySelector(".lab")).toBeNull();
    expect(container.textContent).not.toMatch(/calibration|home\.lab|mind's eye/i);
  });
});
