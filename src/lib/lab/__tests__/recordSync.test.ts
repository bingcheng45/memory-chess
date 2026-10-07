import { FakeChannel, freshSyncModule } from "./fakeChannel";

const tab = freshSyncModule;

describe("lab record sync", () => {
  beforeEach(() => {
    FakeChannel.open.clear();
    FakeChannel.posted = [];
    Object.assign(globalThis, { BroadcastChannel: FakeChannel });
  });
  afterEach(() => Reflect.deleteProperty(globalThis, "BroadcastChannel"));

  it("tells every other tab once and never the tab that posted", () => {
    const [saver, other] = [tab(), tab()];
    const inSaver = jest.fn();
    const inOther = jest.fn();
    saver.onLabChange(inSaver);
    other.onLabChange(inOther);

    other.tellOtherTabs();
    expect([inSaver.mock.calls.length, inOther.mock.calls.length]).toEqual([1, 0]);

    inSaver.mockClear();
    saver.tellOtherTabs();
    expect([inSaver.mock.calls.length, inOther.mock.calls.length]).toEqual([0, 1]);
  });

  it("calls the saving tab's own listener once for a change it announces", () => {
    const sync = tab();
    const listener = jest.fn();
    sync.onLabChange(listener);

    sync.announceLabChange();

    expect(listener).toHaveBeenCalledTimes(1);
    expect(FakeChannel.posted).toHaveLength(1);
  });

  it("never posts again on receipt, so two tabs cannot echo a change back and forth", () => {
    const [first, second] = [tab(), tab()];
    first.onLabChange(() => undefined);
    second.onLabChange(() => undefined);

    first.announceLabChange();

    expect(FakeChannel.posted).toHaveLength(1);
  });

  it("stops listening when unsubscribed", () => {
    const [saver, other] = [tab(), tab()];
    const listener = jest.fn();
    const stop = other.onLabChange(listener);

    stop();
    saver.announceLabChange();
    window.dispatchEvent(new Event(saver.LAB_RECORD_CHANGED));

    expect(listener).not.toHaveBeenCalled();
  });

  it("falls back to the storage event on the summary key without BroadcastChannel", () => {
    Reflect.deleteProperty(globalThis, "BroadcastChannel");
    const sync = tab();
    const listener = jest.fn();
    const stop = sync.onLabChange(listener);

    window.dispatchEvent(new StorageEvent("storage", { key: "memory-chess-sound" }));
    window.dispatchEvent(new StorageEvent("storage", { key: "memory-chess-lab-summary" }));
    window.dispatchEvent(new StorageEvent("storage", { key: null }));
    sync.tellOtherTabs();
    stop();
    window.dispatchEvent(new StorageEvent("storage", { key: "memory-chess-lab-summary" }));

    expect(listener).toHaveBeenCalledTimes(2);
  });
});
