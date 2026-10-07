import { act, renderHook, waitFor } from "@testing-library/react";
import { useLabData } from "@/hooks/useLabData";
import { labStore, type LabStore } from "@/lib/lab/storage";
import { EMPTY_SUMMARY, summarize } from "@/lib/lab/summary";
import { FakeChannel } from "@/lib/lab/__tests__/fakeChannel";
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

/** Another open tab: its own copy of the sync module, sharing only the channel. */
type Sync = typeof import("@/lib/lab/recordSync");

function otherTab(): Sync {
  let sync: Sync | undefined;
  jest.isolateModules(() => {
    sync = jest.requireActual<Sync>("@/lib/lab/recordSync");
  });
  if (!sync) throw new Error("recordSync did not load");
  return sync;
}

describe("useLabData", () => {
  beforeEach(() => {
    FakeChannel.open.clear();
    FakeChannel.posted = [];
    Object.assign(globalThis, { BroadcastChannel: FakeChannel });
  });
  afterEach(() => Reflect.deleteProperty(globalThis, "BroadcastChannel"));

  it("shows a round another tab recorded without a reload of the page", async () => {
    const rounds = [round({ id: "a" })];
    jest.mocked(labStore).mockReturnValue(storeWith(rounds));
    const { result } = renderHook(() => useLabData());
    await waitFor(() => expect(result.current.summary.rounds).toBe(1));

    rounds.push(round({ id: "b", endedAt: Date.UTC(2026, 9, 8, 9) }));
    act(() => otherTab().announceLabChange());

    await waitFor(() => expect(result.current.summary.rounds).toBe(2));
    expect(result.current.records.map(({ id }) => id)).toEqual(["a", "b"]);
    expect(FakeChannel.posted).toHaveLength(1);
  });

  it("closes its channel when the screen unmounts", async () => {
    jest.mocked(labStore).mockReturnValue(storeWith([]));
    const { result, unmount } = renderHook(() => useLabData());
    await waitFor(() => expect(result.current.storage).toBe("available"));

    expect(FakeChannel.open.size).toBe(1);
    unmount();
    expect(FakeChannel.open.size).toBe(0);
  });
});
