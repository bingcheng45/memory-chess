import { render, screen } from "@testing-library/react";
import FaqSection from "@/components/ui/FaqSection";

describe("FaqSection", () => {
  it("answers common player questions in clear language", () => {
    render(<FaqSection />);

    expect(
      screen.getByRole("heading", { name: "Questions About Memory Chess" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "What is Memory Chess?" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", {
        name: "Can beginners play Memory Chess?",
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Is Memory Chess free?" }),
    ).toBeInTheDocument();
  });
});
