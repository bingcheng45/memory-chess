import { render, screen, within } from "@testing-library/react";
import ChangelogPage from "@/app/changelog/page";

jest.mock("@/components/ui/PageHeader", () => {
  function MockPageHeader() {
    return <div>Memory Chess header</div>;
  }

  return MockPageHeader;
});

jest.mock("@/components/ui/Footer", () => {
  function MockFooter() {
    return <div>Changelog footer</div>;
  }

  return MockFooter;
});

describe("ChangelogPage", () => {
  it("renders every release in newest-first order", () => {
    render(<ChangelogPage />);

    const versionHeadings = screen.getAllByRole("heading", {
      name: /^v\d+\.\d+\.\d+$/,
    });

    expect(versionHeadings.map((heading) => heading.textContent)).toEqual([
      "v1.2.1",
      "v1.2.0",
      "v1.1.0",
      "v1.0.1",
      "v1.0.0",
    ]);
    expect(
      screen.getByRole("heading", { name: "Steadier gameplay" }),
    ).toBeInTheDocument();
    expect(screen.getByText(/reported this on Reddit/)).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Thank you for playing" }),
    ).toBeInTheDocument();
    expect(screen.getByText(/over 32,000 games played/)).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Contact Us page" }),
    ).toHaveAttribute("href", "/contact-us");

    expect(
      screen.getByRole("heading", { name: "Some statistics for everyone!" }),
    ).toBeInTheDocument();
    const accuracyTable = screen.getByRole("table", { name: "Accuracy" });
    expect(within(accuracyTable).getByText("72.3%")).toBeInTheDocument();
    expect(within(accuracyTable).getByText("89.1%")).toBeInTheDocument();
    const speedTable = screen.getByRole("table", {
      name: "Submission speed",
    });
    expect(within(speedTable).getByText("15.88s")).toBeInTheDocument();
    expect(within(speedTable).getByText("17.60s")).toBeInTheDocument();
    expect(screen.getByText("August 16, 2026")).toBeInTheDocument();
    expect(screen.getByText("August 15, 2026")).toBeInTheDocument();
    expect(screen.getByText("Changelog footer")).toBeInTheDocument();
  });
});
