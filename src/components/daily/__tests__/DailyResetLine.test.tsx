import { render, screen } from "@/test-utils/intl";
import { DailyResetLine } from "@/components/daily/DailyResetLine";

describe("the daily page's countdown to the next board", () => {
  it.each([
    ["2026-10-13T23:59:30Z", "Next board in under a minute"],
    ["2026-10-13T23:58:59Z", "Next board in 1 min"],
    ["2026-10-13T22:30:30Z", "Next board in 1 h 29 min"],
    ["2026-10-14T00:00:00.500Z", "Next board in 23 h 59 min"],
  ])("reads %s as %s", (at, text) => {
    render(<DailyResetLine now={Date.parse(at)} />);

    expect(screen.getByText(text)).toBeInTheDocument();
  });
});
