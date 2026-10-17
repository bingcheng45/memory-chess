/** @jest-environment <rootDir>/src/test-utils/machineZoneEnvironment.ts */
import type { ReactNode } from "react";
import { render } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { Dashboard } from "@/components/dashboard/Dashboard";
import type { LabData } from "@/hooks/useLabData";
import { persona } from "@/test-utils/labPersona";
import messages from "../../../../messages/en.json";

declare const setMachineTimeZone: (zone: string) => void;

jest.mock("@/lib/analytics/events", () => ({ ...jest.requireActual("@/lib/analytics/events"), trackEvent: jest.fn() }));
jest.mock("@/components/dashboard/shareImage", () => ({ drawShareCard: () => Promise.resolve(new Blob(["png"], { type: "image/png" })) }));

let labData: LabData;
jest.mock("@/hooks/useLabData", () => ({
  ...jest.requireActual("@/hooks/useLabData"),
  useLabData: () => labData,
}));

const PLAYED_AT = Date.parse("2026-10-17T20:30:00Z");

/** The newest round of the record is the one played at `endedAt`. */
function withNewestRoundAt(endedAt: number): LabData {
  const base = persona("threeDays");
  const newest = Math.max(...base.records.map((record) => record.endedAt));
  return { ...base, records: base.records.map((record) => (record.endedAt === newest ? { ...record, endedAt } : record)) };
}

/** The locale layout hands every client component a provider pinned to the server's zone, which is UTC in production. */
function ServerZone({ children }: { children: ReactNode }) {
  return (
    <NextIntlClientProvider locale="en" messages={messages} timeZone="UTC">
      {children}
    </NextIntlClientProvider>
  );
}

const newestRowTime = () => document.querySelector("[data-history-row] time");

describe("Dashboard history times", () => {
  beforeEach(() => {
    window.localStorage.clear();
    URL.createObjectURL = jest.fn(() => "blob:card");
    URL.revokeObjectURL = jest.fn();
    labData = withNewestRoundAt(PLAYED_AT);
  });

  it("shows a round played at 20:30 UTC on 17 October as 18 October, 4:30 AM for a viewer in Singapore", () => {
    setMachineTimeZone("Asia/Singapore");
    render(<Dashboard />, { wrapper: ServerZone });

    expect(newestRowTime()?.textContent).toBe("Oct 18, 2026, 4:30 AM");
  });

  it("shows the same round as 17 October, 1:30 PM for a viewer in Los Angeles", () => {
    setMachineTimeZone("America/Los_Angeles");
    render(<Dashboard />, { wrapper: ServerZone });

    expect(newestRowTime()?.textContent).toBe("Oct 17, 2026, 1:30 PM");
  });

  it("keeps the machine-readable time in UTC", () => {
    setMachineTimeZone("Asia/Singapore");
    render(<Dashboard />, { wrapper: ServerZone });

    expect(newestRowTime()).toHaveAttribute("dateTime", "2026-10-17T20:30:00.000Z");
  });
});
