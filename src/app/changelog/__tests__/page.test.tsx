import { render, screen } from "@testing-library/react";
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
      "v1.2.0",
      "v1.1.0",
      "v1.0.1",
      "v1.0.0",
    ]);
    expect(screen.getByText("August 16, 2026")).toBeInTheDocument();
    expect(screen.getByText("Changelog footer")).toBeInTheDocument();
  });
});
