import { act, renderHook, waitFor } from "@testing-library/react";
import { useLabData } from "@/hooks/useLabData";
import { labStore, type LabStore } from "@/lib/lab/storage";
import { EMPTY_SUMMARY, summarize } from "@/lib/lab/summary";
import { FakeChannel, freshSyncModule as otherTab } from "@/lib/lab/__tests__/fakeChannel";
import { round } from "@/lib/lab/__tests__/fixtures";

jest.mock("@/lib/lab/storage", () => ({ ...jest.requireActual("@/lib/lab/storage"), labStore: jest.fn() }));

function storeWith(rounds: ReturnType<typeof round>[]): LabStore {
  return {
    isAvailable: () => Promise.resolve(true),
    addRound: () => Promise.resolve(true),
    listRounds: () => Promise.resolve([...rounds]),
    mergeRounds: () => Promise.resolve(0),
    restore: () => Promise.resolve(null),
    readSummary: () => Promise.resolve(rounds.length ? summarize(rounds) : EMPTY_SUMMARY),
    clear: () => Promise.resolve(),
    readLastBackup: () => null,
    markBackedUp: () => undefined,
  };
}

describe("useLabData", () => {
  // jsdom gives every "tab" one window, so these tests use the channel path alone; the hook's channel lives as long as the module.
  beforeEach(() => {
    FakeChannel.posted = [];
    Object.assign(globalThis, { BroadcastChannel: FakeChannel });
  });

  it("shows a round another tab recorded without a reload of the page", async () => {
    const rounds = [round({ id: "a" })];
    jest.mocked(labStore).mockReturnValue(storeWith(rounds));
    const { result } = renderHook(() => useLabData());
    await waitFor(() => expect(result.current.summary.rounds).toBe(1));

    rounds.push(round({ id: "b", endedAt: Date.UTC(2026, 9, 8, 9) }));
    act(() => otherTab().tellOtherTabs());

    await waitFor(() => expect(result.current.summary.rounds).toBe(2));
    expect(result.current.records.map(({ id }) => id)).toEqual(["a", "b"]);
    expect(FakeChannel.posted).toHaveLength(1);
  });

  it("stops reloading once the screen unmounts", async () => {
    const store = storeWith([]);
    const listRounds = jest.spyOn(store, "listRounds");
    jest.mocked(labStore).mockReturnValue(store);
    const { result, unmount } = renderHook(() => useLabData());
    await waitFor(() => expect(listRounds).toHaveBeenCalledTimes(1));

    act(() => otherTab().tellOtherTabs());
    await waitFor(() => expect(listRounds).toHaveBeenCalledTimes(2));
    unmount();
    otherTab().tellOtherTabs();
    await new Promise((resolve) => setTimeout(resolve, 20));

    expect(result.current.storage).toBe("available");
    expect(listRounds).toHaveBeenCalledTimes(2);
  });
});
