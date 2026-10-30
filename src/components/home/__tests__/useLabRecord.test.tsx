import { act, renderHook, waitFor } from "@testing-library/react";
import { useLabData } from "@/hooks/useLabData";
import { useLabRecord } from "@/components/home/useLabRecord";
import { labStore, type LabStore } from "@/lib/lab/storage";
import { EMPTY_SUMMARY, summarize } from "@/lib/lab/summary";
import { buildExport, parseImport } from "@/lib/lab/transfer";
import { round } from "@/lib/lab/__tests__/fixtures";
import { FakeChannel } from "@/lib/lab/__tests__/fakeChannel";
import type { RoundRecord } from "@/lib/lab/record";
import { LAB_RECORD_CHANGED } from "@/lib/lab/recordSync";
import { standingOf, useGameStore } from "@/lib/store/gameStore";

jest.mock("@/lib/analytics/events", () => ({ trackEvent: jest.fn() }));
jest.mock("@/lib/lab/storage", () => ({ ...jest.requireActual("@/lib/lab/storage"), labStore: jest.fn() }));

const REVOKE_AFTER_MS = 30_000;

function fakeStore(): LabStore {
  return {
    isAvailable: jest.fn(() => Promise.resolve(true)),
    addRound: jest.fn(() => Promise.resolve(true)),
    listRounds: jest.fn(() => Promise.resolve([])),
    mergeRounds: jest.fn(() => Promise.resolve(0)),
    restore: jest.fn(() => Promise.resolve(null)),
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

describe("useLabRecord identity", () => {
  afterEach(() => jest.restoreAllMocks());

  it("hands back the same record on a rerender until the record or its backup time changes", async () => {
    jest.mocked(labStore).mockReturnValue(fakeStore());
    URL.createObjectURL = jest.fn(() => "blob:lab");
    URL.revokeObjectURL = jest.fn();
    jest.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});
    jest.spyOn(Date, "now").mockReturnValue(1_700_000_000_000);
    const { result, rerender } = renderHook(() => useLabRecord());
    await waitFor(() => expect(result.current.storage).toBe("available"));
    const loaded = result.current;

    rerender();
    expect(result.current).toBe(loaded);

    await act(() => result.current.download());
    expect([result.current === loaded, result.current.lastBackup]).toEqual([false, 1_700_000_000_000]);
  });
});

describe("useLabRecord import", () => {
  const rounds = [round({ id: "a", endedAt: 1 }), round({ id: "b", endedAt: 2 })];
  const json = JSON.stringify(buildExport(rounds, 0, { ...summarize(rounds), rounds: 9 }));
  // jsdom's File has no text(), which the browser's does.
  const file = () => Object.assign(new File([json], "lab.json"), { text: () => Promise.resolve(json) });

  it("restores the file's lifetime totals into an empty record", async () => {
    const store = fakeStore();
    store.restore = jest.fn(() => Promise.resolve(2));
    jest.mocked(labStore).mockReturnValue(store);
    const { result } = renderHook(() => useLabRecord());

    const outcome = await act(() => result.current.importFile(file()));

    expect(outcome).toEqual({ ok: true, added: 2, rejected: 0, overCap: 0, summary: "restored", player: null });
    expect(jest.mocked(store.restore).mock.calls[0]).toEqual([rounds, { ...summarize(rounds), rounds: 9 }]);
    expect(store.mergeRounds).not.toHaveBeenCalled();
  });

  it("merges only the rounds when the record already has some", async () => {
    const store = fakeStore();
    store.mergeRounds = jest.fn(() => Promise.resolve(1));
    jest.mocked(labStore).mockReturnValue(store);
    const { result } = renderHook(() => useLabRecord());

    const outcome = await act(() => result.current.importFile(file()));

    expect(outcome).toEqual({ ok: true, added: 1, rejected: 0, overCap: 0, summary: "ignored", player: null });
    expect(store.mergeRounds).toHaveBeenCalledWith(rounds);
  });

  it("tells other open tabs once the imported rounds are saved", async () => {
    Object.assign(globalThis, { BroadcastChannel: FakeChannel });
    FakeChannel.posted = [];
    const store = fakeStore();
    store.mergeRounds = jest.fn(() => Promise.resolve(2));
    jest.mocked(labStore).mockReturnValue(store);
    const { result } = renderHook(() => useLabRecord());

    await act(() => result.current.importFile(file()));

    expect(FakeChannel.posted).toHaveLength(1);
    Reflect.deleteProperty(globalThis, "BroadcastChannel");
  });

  it("refreshes another reader of the record in the same tab after an import adds rounds", async () => {
    const saved: RoundRecord[] = [];
    const store = fakeStore();
    store.listRounds = jest.fn(() => Promise.resolve([...saved]));
    store.mergeRounds = jest.fn((incoming) => {
      saved.push(...incoming);
      return Promise.resolve(incoming.length);
    });
    jest.mocked(labStore).mockReturnValue(store);
    const { result } = renderHook(() => ({ record: useLabRecord(), other: useLabData() }));
    await waitFor(() => expect(result.current.other.storage).toBe("available"));

    await act(() => result.current.record.importFile(file()));

    await waitFor(() => expect(result.current.other.records.map(({ id }) => id)).toEqual(["a", "b"]));
    expect(result.current.record.records.map(({ id }) => id)).toEqual(["a", "b"]);
  });

  it("announces nothing when the file adds no rounds", async () => {
    Object.assign(globalThis, { BroadcastChannel: FakeChannel });
    FakeChannel.posted = [];
    const heard = jest.fn();
    window.addEventListener(LAB_RECORD_CHANGED, heard);
    jest.mocked(labStore).mockReturnValue(fakeStore());
    const { result } = renderHook(() => useLabRecord());

    const outcome = await act(() => result.current.importFile(file()));

    expect(outcome).toEqual({ ok: true, added: 0, rejected: 0, overCap: 0, summary: "ignored", player: null });
    expect([FakeChannel.posted.length, heard.mock.calls.length]).toEqual([0, 0]);
    window.removeEventListener(LAB_RECORD_CHANGED, heard);
    Reflect.deleteProperty(globalThis, "BroadcastChannel");
  });
});

const blobText = (blob: Blob) =>
  new Promise<string>((resolve) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.readAsText(blob);
  });

describe("useLabRecord rating and streak", () => {
  const standing = { skillRating: 1234, streak: 7, certainty: { rd: 80.5, rounds: 42 } };
  const reset = () => useGameStore.setState({ gameState: { ...useGameStore.getState().gameState, skillRating: 1000, streak: 0 }, certainty: { rd: 350, rounds: 0 } });

  beforeEach(() => {
    reset();
    URL.createObjectURL = jest.fn(() => "blob:lab");
    URL.revokeObjectURL = jest.fn();
    jest.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});
  });
  afterEach(() => {
    jest.restoreAllMocks();
    reset();
  });

  it("exports the rating and streak, and a new device restores them from that file", async () => {
    jest.mocked(labStore).mockReturnValue(fakeStore());
    useGameStore.getState().restoreStanding(standing);
    const { result } = renderHook(() => useLabRecord());
    await act(() => result.current.download());
    const blob = jest.mocked(URL.createObjectURL).mock.calls[0][0] as Blob;
    const exported = await blobText(blob);
    reset();

    const outcome = await act(() =>
      result.current.importFile(Object.assign(new File([exported], "lab.json"), { text: () => Promise.resolve(exported) })),
    );

    expect(outcome).toMatchObject({ ok: true, player: "restored" });
    expect(standingOf(useGameStore.getState())).toEqual(standing);
  });

  it("keeps the device's rating when it has played more rated rounds than the file", async () => {
    jest.mocked(labStore).mockReturnValue(fakeStore());
    useGameStore.getState().restoreStanding({ skillRating: 1500, streak: 2, certainty: { rd: 60, rounds: 90 } });
    const json = JSON.stringify(buildExport([], 0, undefined, standing));
    const { result } = renderHook(() => useLabRecord());

    const outcome = await act(() => result.current.importFile(Object.assign(new File([json], "lab.json"), { text: () => Promise.resolve(json) })));

    expect(outcome).toMatchObject({ ok: true, player: "kept" });
    expect(standingOf(useGameStore.getState())).toEqual({ skillRating: 1500, streak: 2, certainty: { rd: 60, rounds: 90 } });
  });

  it("still saves a file, without a standing, when the game store cannot be read", async () => {
    jest.mocked(labStore).mockReturnValue(fakeStore());
    jest.spyOn(useGameStore, "getState").mockImplementation(() => {
      throw new Error("chunk failed");
    });
    const { result } = renderHook(() => useLabRecord());

    await act(() => result.current.download());

    const blob = jest.mocked(URL.createObjectURL).mock.calls[0][0] as Blob;
    const exported = JSON.parse(await blobText(blob));
    expect([exported.v, exported.player]).toEqual([3, undefined]);
    expect(parseImport(JSON.stringify(exported))).toMatchObject({ ok: true, player: null });
  });

  it("reports the rounds as imported when the standing cannot be restored", async () => {
    const store = fakeStore();
    store.mergeRounds = jest.fn(() => Promise.resolve(2));
    jest.mocked(labStore).mockReturnValue(store);
    jest.spyOn(useGameStore, "getState").mockImplementation(() => {
      throw new Error("chunk failed");
    });
    const rounds = [round({ id: "a", endedAt: 1 }), round({ id: "b", endedAt: 2 })];
    const json = JSON.stringify(buildExport(rounds, 0, undefined, standing));
    const { result } = renderHook(() => useLabRecord());

    const outcome = await act(() => result.current.importFile(Object.assign(new File([json], "lab.json"), { text: () => Promise.resolve(json) })));

    expect(outcome).toEqual({ ok: true, added: 2, rejected: 0, overCap: 0, summary: null, player: "dropped" });
  });
});
