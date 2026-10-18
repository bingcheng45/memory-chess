import { fireEvent } from "@testing-library/react";
import { renderWithIntl, screen } from "@/test-utils/intl";
import { Dashboard } from "@/components/dashboard/Dashboard";
import type { LabData } from "@/hooks/useLabData";
import { persona } from "@/test-utils/labPersona";

let mockChunkFailures = 0;
jest.mock("@/components/dashboard/DashboardHistory", () => {
  if (mockChunkFailures > 0) {
    mockChunkFailures -= 1;
    throw new Error("Loading chunk 4410 failed.");
  }
  return jest.requireActual("@/components/dashboard/DashboardHistory");
});

let labData: LabData;
jest.mock("@/hooks/useLabData", () => ({
  ...jest.requireActual("@/hooks/useLabData"),
  useLabData: () => labData,
}));

const unhandled: unknown[] = [];
const noteUnhandled = (reason: unknown) => unhandled.push(reason);
beforeEach(() => {
  unhandled.length = 0;
  process.on("unhandledRejection", noteUnhandled);
  URL.createObjectURL = jest.fn(() => "blob:card");
  URL.revokeObjectURL = jest.fn();
});
afterEach(() => process.off("unhandledRejection", noteUnhandled));

describe("the history and analysis code, when it cannot be fetched", () => {
  it("says so in place of the history and loads it again on Try again", async () => {
    mockChunkFailures = 1;
    labData = persona("threeDays");
    renderWithIntl(<Dashboard />);

    expect((await screen.findByText("Something went wrong on this page.", {}, { timeout: 10_000 })).closest("section")?.id).toBe("history");
    expect(document.querySelector(".lab-hist-pending")).toBeNull();
    expect(document.querySelector(".lab-dash-pending")).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: "Try again" }));
    expect(await screen.findByText("Showing 12 of 12 rounds", {}, { timeout: 10_000 })).toBeInTheDocument();
    expect(screen.queryByText("Something went wrong on this page.")).toBeNull();
    await new Promise((settled) => setTimeout(settled, 0));
    expect(unhandled).toEqual([]);
  }, 20_000);
});
