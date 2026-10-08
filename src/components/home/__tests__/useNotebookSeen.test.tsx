import { act, renderWithIntl, screen, within } from "@/test-utils/intl";
import { LabRecordSection } from "@/components/home/LabRecordSection";
import { persona } from "@/test-utils/labPersona";

jest.mock("@/lib/analytics/events", () => ({ trackEvent: jest.fn() }));

const notebook = () => screen.getByText(/^Fig\. 6\.\d+ · Lab notebook$/).closest(".lab-panel") as HTMLElement;

it("keeps the visit in memory for the session when storage refuses the write, so entries do not stay new on every visit", () => {
  const sightings: IntersectionObserverCallback[] = [];
  window.IntersectionObserver = jest.fn((callback: IntersectionObserverCallback) => {
    sightings.push(callback);
    return { observe: jest.fn(), disconnect: jest.fn(), unobserve: jest.fn() };
  }) as unknown as typeof IntersectionObserver;
  jest.spyOn(Date, "now").mockReturnValue(Date.UTC(2026, 9, 8, 18));
  jest.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
    throw new Error("quota");
  });

  const first = renderWithIntl(<LabRecordSection record={persona("threeDays")} />);
  expect(within(notebook()).getAllByText("New")).toHaveLength(4);
  act(() => sightings.forEach((callback) => callback([{ isIntersecting: true } as IntersectionObserverEntry], {} as IntersectionObserver)));
  first.unmount();

  renderWithIntl(<LabRecordSection record={persona("threeDays")} />);
  expect(within(notebook()).queryByText("New")).toBeNull();
});
