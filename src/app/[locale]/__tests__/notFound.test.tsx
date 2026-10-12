import { render, screen, within } from "@/test-utils/intl";
import NotFound from "@/app/[locale]/not-found";
import deMessages from "../../../../messages/de.json";

jest.mock("next/navigation", () => ({
  ...jest.requireActual("next/navigation"),
  usePathname: () => "/not-here",
  useRouter: () => ({ push: jest.fn(), replace: jest.fn(), prefetch: jest.fn() }),
  useParams: () => ({ locale: "de" }),
}));

it("says the page does not exist in the reader's language and offers the game and the home page", () => {
  render(<NotFound />, { locale: "de", messages: deMessages });
  const main = screen.getByRole("main");

  expect(within(main).getByRole("heading", { level: 1 })).toHaveTextContent("Diese Seite gibt es nicht.");
  expect(within(main).getAllByRole("link").map((link) => [link.textContent, link.getAttribute("href")])).toEqual([
    ["Eine Runde spielen", "/de/game"],
    ["Zur Startseite", "/de"],
  ]);
  expect(document.title).toBe("Seite nicht gefunden | Memory Chess");
});
