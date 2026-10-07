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
