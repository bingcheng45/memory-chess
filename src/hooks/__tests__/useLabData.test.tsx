import { act, renderHook, waitFor } from "@testing-library/react";
import { useLabData } from "@/hooks/useLabData";
import { labStore, type LabStore } from "@/lib/lab/storage";
import { EMPTY_SUMMARY, summarize } from "@/lib/lab/summary";
import { FakeChannel, freshSyncModule as otherTab } from "@/lib/lab/__tests__/fakeChannel";
import { announceLabChange } from "@/lib/lab/recordSync";
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

  it("removes every listener it added when the screen unmounts", async () => {
    jest.mocked(labStore).mockReturnValue(storeWith([]));
    const targets = [window, document];
    const added = targets.map((target) => jest.spyOn(target, "addEventListener"));
    const removed = targets.map((target) => jest.spyOn(target, "removeEventListener"));
    const { unmount } = renderHook(() => useLabData());
    const pairs = (spies: jest.SpyInstance[]) => spies.flatMap((spy) => spy.mock.calls.map(([type, listener]) => [type, listener]));
    const addedPairs = pairs(added);

    unmount();

    expect(addedPairs.map(([type]) => type).sort()).toEqual(["memory-chess-lab-changed", "visibilitychange"]);
    expect(pairs(removed)).toEqual(expect.arrayContaining(addedPairs));
    [...added, ...removed].forEach((spy) => spy.mockRestore());
  });
});

describe("useLabData reloads", () => {
  /** listRounds answers only when the test says so, with the rounds as they were when it was asked. */
  function controlledStore(rounds: ReturnType<typeof round>[]) {
    const pending: (() => void)[] = [];
    const store: LabStore = {
      ...storeWith(rounds),
      listRounds: jest.fn(() => {
        const snapshot = [...rounds];
        return new Promise((resolve) => pending.push(() => resolve(snapshot)));
      }),
    };
    const settle = () => act(() => new Promise((resolve) => setTimeout(resolve, 0)));
    const answerNewestFirst = async () => {
      await settle();
      while (pending.length > 0) {
        await act(async () => pending.pop()!());
        await settle();
      }
    };
    return { store, answerNewestFirst };
  }
  const ids = (records: readonly { id: string }[]) => records.map(({ id }) => id);
  const setVisibility = (state: DocumentVisibilityState) => {
    Object.defineProperty(document, "visibilityState", { configurable: true, get: () => state });
    document.dispatchEvent(new Event("visibilitychange"));
  };
  afterEach(() => setVisibility("visible"));

  it("keeps the newest read when an older one answers last, and folds rapid changes into one read", async () => {
    const rounds = [round({ id: "a" })];
    const { store, answerNewestFirst } = controlledStore(rounds);
    jest.mocked(labStore).mockReturnValue(store);
    const { result } = renderHook(() => useLabData());
    await answerNewestFirst();
    await waitFor(() => expect(ids(result.current.records)).toEqual(["a"]));

    rounds.push(round({ id: "b", endedAt: Date.UTC(2026, 9, 8, 9) }));
    await act(async () => announceLabChange());
    rounds.push(round({ id: "c", endedAt: Date.UTC(2026, 9, 8, 10) }));
    await act(async () => {
      announceLabChange();
      announceLabChange();
      announceLabChange();
    });
    await answerNewestFirst();

    expect(ids(result.current.records)).toEqual(["a", "b", "c"]);
    expect(store.listRounds).toHaveBeenCalledTimes(3);
  });

  it("waits until a hidden tab is shown before reading a change", async () => {
    const rounds = [round({ id: "a" })];
    jest.mocked(labStore).mockReturnValue(storeWith(rounds));
    const { result } = renderHook(() => useLabData());
    await waitFor(() => expect(ids(result.current.records)).toEqual(["a"]));
    const listRounds = jest.spyOn(jest.mocked(labStore)()!, "listRounds");

    setVisibility("hidden");
    rounds.push(round({ id: "b", endedAt: Date.UTC(2026, 9, 8, 9) }));
    act(() => otherTab().tellOtherTabs());
    act(() => otherTab().tellOtherTabs());
    await new Promise((resolve) => setTimeout(resolve, 20));
    expect(ids(result.current.records)).toEqual(["a"]);

    act(() => setVisibility("visible"));

    await waitFor(() => expect(ids(result.current.records)).toEqual(["a", "b"]));
    expect(listRounds).toHaveBeenCalledTimes(1);
  });
});
