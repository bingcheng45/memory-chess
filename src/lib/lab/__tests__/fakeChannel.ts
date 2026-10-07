/** Stands in for BroadcastChannel: every open instance with the same name but the sender receives each post. */
export class FakeChannel {
  static open = new Set<FakeChannel>();
  static posted: unknown[] = [];
  onmessage: ((event: MessageEvent) => void) | null = null;

  constructor(readonly name: string) {
    FakeChannel.open.add(this);
  }

  postMessage(data: unknown) {
    FakeChannel.posted.push(data);
    FakeChannel.open.forEach((channel) => {
      if (channel !== this && channel.name === this.name) channel.onmessage?.({ data } as MessageEvent);
    });
  }

  close() {
    FakeChannel.open.delete(this);
  }
}

type Sync = typeof import("@/lib/lab/recordSync");

/** The sync module loaded afresh, as a second open tab would hold its own copy. */
export function freshSyncModule(): Sync {
  let sync: Sync | undefined;
  jest.isolateModules(() => {
    sync = jest.requireActual<Sync>("@/lib/lab/recordSync");
  });
  if (!sync) throw new Error("recordSync did not load");
  return sync;
}
