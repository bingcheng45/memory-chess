import { fireEvent, render, screen, within } from "@/test-utils/intl";
import ErrorPage from "@/app/[locale]/error";
import ErrorBoundary from "@/components/ui/ErrorBoundary";
import { GLOBAL_ERROR_COPY } from "@/components/lab-paper/globalErrorCopy";
import enMessages from "../../../../messages/en.json";
import jaMessages from "../../../../messages/ja.json";

jest.mock("next/navigation", () => ({
  ...jest.requireActual("next/navigation"),
  usePathname: () => "/game",
  useRouter: () => ({ push: jest.fn(), replace: jest.fn(), prefetch: jest.fn() }),
  useParams: () => ({ locale: "en" }),
}));

beforeEach(() => {
  jest.spyOn(console, "error").mockImplementation(() => undefined);
});

describe("the locale error page", () => {
  it("says what happened, that saved rounds are safe, and retries the page", () => {
    const reset = jest.fn();
    render(<ErrorPage error={new Error("render failed")} reset={reset} />);
    const main = screen.getByRole("main");

    expect(within(main).getByRole("heading", { level: 1 })).toHaveTextContent("Something went wrong on this page.");
    expect(main).toHaveTextContent("Your rounds and settings are stored in this browser and are not affected.");
    expect(within(main).getByRole("link", { name: "Go to the home page" })).toHaveAttribute("href", "/");
    expect(document.title).toBe("Something went wrong | Memory Chess");

    fireEvent.click(within(main).getByRole("button", { name: "Try again" }));

    expect(reset).toHaveBeenCalledTimes(1);
  });

  it("speaks the reader's language", () => {
    render(<ErrorPage error={new Error("render failed")} reset={jest.fn()} />, { locale: "ja", messages: jaMessages });

    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("このページで問題が発生しました。");
    expect(screen.getByRole("button", { name: "もう一度試す" })).toBeInTheDocument();
  });
});

it("keeps the global error page's English copy equal to the catalogue", () => {
  const { error, home } = enMessages.errorPages;

  expect(GLOBAL_ERROR_COPY).toEqual({ ...error, home });
});

describe("ErrorBoundary without a fallback", () => {
  it("shows the error page's message in place of the failed part and draws it again on retry", () => {
    let shouldThrow = true;
    function Flaky() {
      if (shouldThrow) throw new Error("board failed");
      return <p>Board ready</p>;
    }
    render(
      <ErrorBoundary>
        <Flaky />
      </ErrorBoundary>,
    );

    expect(screen.getByRole("alert")).toHaveTextContent("Something went wrong on this page.");
    expect(screen.queryByText("board failed")).toBeNull();

    shouldThrow = false;
    fireEvent.click(screen.getByRole("button", { name: "Try again" }));

    expect(screen.getByText("Board ready")).toBeInTheDocument();
  });
});
