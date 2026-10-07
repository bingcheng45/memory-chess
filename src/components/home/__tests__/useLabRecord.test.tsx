import { act, renderHook } from "@testing-library/react";
import { useLabRecord } from "@/components/home/useLabRecord";
import { labStore, type LabStore } from "@/lib/lab/storage";
import { EMPTY_SUMMARY } from "@/lib/lab/summary";

jest.mock("@/lib/analytics/events", () => ({ trackEvent: jest.fn() }));
jest.mock("@/lib/lab/storage", () => ({ ...jest.requireActual("@/lib/lab/storage"), labStore: jest.fn() }));

const REVOKE_AFTER_MS = 30_000;

function fakeStore(): LabStore {
  return {
    isAvailable: jest.fn(() => Promise.resolve(true)),
    addRound: jest.fn(() => Promise.resolve(true)),
    listRounds: jest.fn(() => Promise.resolve([])),
    mergeRounds: jest.fn(() => Promise.resolve(0)),
    readSummary: jest.fn(() => Promise.resolve(EMPTY_SUMMARY)),
    clear: jest.fn(() => Promise.resolve()),
    readLastBackup: jest.fn(() => null),
    markBackedUp: jest.fn(),
  };
}

describe("useLabRecord download", () => {
  beforeEach(() => {
    jest.useFakeTimers();
    URL.createObjectURL = jest.fn(() => "blob:lab");
    URL.revokeObjectURL = jest.fn();
  });

  afterEach(() => jest.useRealTimers());

  it("clicks a link that is in the document, removes it, and revokes the URL only later", async () => {
    const store = fakeStore();
    jest.mocked(labStore).mockReturnValue(store);
    const inDocumentAtClick: boolean[] = [];
    jest.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(function (this: HTMLAnchorElement) {
      inDocumentAtClick.push(document.body.contains(this));
    });
    const { result } = renderHook(() => useLabRecord());

    await act(() => result.current.download());

    expect(inDocumentAtClick).toEqual([true]);
    expect(document.querySelector('a[download="memory-chess-lab-record.json"]')).toBeNull();
    expect(URL.revokeObjectURL).not.toHaveBeenCalled();
    act(() => jest.advanceTimersByTime(REVOKE_AFTER_MS));
    expect(URL.revokeObjectURL).toHaveBeenCalledWith("blob:lab");
    expect(store.markBackedUp).toHaveBeenCalledTimes(1);
  });
});
