import { SUMMARY_KEY } from "./storage";

export const LAB_RECORD_CHANGED = "memory-chess-lab-changed";
const CHANNEL = "memory-chess-lab";
/** Another listener in this same tab gets this tab's posts too, so each post names its tab. */
const TAB = Math.random().toString(36).slice(2);

/** Without BroadcastChannel the write itself is the signal: it changed the summary key, which fires `storage` in other tabs. */
export function tellOtherTabs(): void {
  if (typeof BroadcastChannel === "undefined") return;
  const channel = new BroadcastChannel(CHANNEL);
  channel.postMessage(TAB);
  channel.close();
}

export function announceLabChange(): void {
  window.dispatchEvent(new Event(LAB_RECORD_CHANGED));
  tellOtherTabs();
}

/** Runs `listener` whenever this tab or another one changes the record. Receiving never posts, so tabs cannot echo. */
export function onLabChange(listener: () => void): () => void {
  window.addEventListener(LAB_RECORD_CHANGED, listener);
  if (typeof BroadcastChannel !== "undefined") {
    const channel = new BroadcastChannel(CHANNEL);
    channel.onmessage = ({ data }) => {
      if (data !== TAB) listener();
    };
    return () => {
      window.removeEventListener(LAB_RECORD_CHANGED, listener);
      channel.close();
    };
  }
  const onStorage = ({ key }: StorageEvent) => {
    if (key === SUMMARY_KEY || key === null) listener();
  };
  window.addEventListener("storage", onStorage);
  return () => {
    window.removeEventListener(LAB_RECORD_CHANGED, listener);
    window.removeEventListener("storage", onStorage);
  };
}
