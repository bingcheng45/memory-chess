import { SUMMARY_KEY } from "./storage";

export const LAB_RECORD_CHANGED = "memory-chess-lab-changed";
const CHANNEL = "memory-chess-lab";

/** One channel per tab: a BroadcastChannel never receives its own posts, so a tab never hears itself. */
let tabChannel: BroadcastChannel | null = null;
const crossTabListeners = new Set<() => void>();

function channel(): BroadcastChannel | null {
  if (typeof BroadcastChannel === "undefined") return null;
  if (!tabChannel) {
    tabChannel = new BroadcastChannel(CHANNEL);
    tabChannel.onmessage = () => crossTabListeners.forEach((listener) => listener());
  }
  return tabChannel;
}

/** Without BroadcastChannel the write itself is the signal: it changed the summary key, which fires `storage` in other tabs. */
export function tellOtherTabs(): void {
  channel()?.postMessage(null);
}

export function announceLabChange(): void {
  window.dispatchEvent(new Event(LAB_RECORD_CHANGED));
  tellOtherTabs();
}

/** Runs `listener` whenever this tab or another one changes the record. Receiving never posts, so tabs cannot echo. */
export function onLabChange(listener: () => void): () => void {
  const onStorage = ({ key }: StorageEvent) => {
    if (key === SUMMARY_KEY || key === null) listener();
  };
  window.addEventListener(LAB_RECORD_CHANGED, listener);
  if (channel()) crossTabListeners.add(listener);
  else window.addEventListener("storage", onStorage);
  return () => {
    window.removeEventListener(LAB_RECORD_CHANGED, listener);
    window.removeEventListener("storage", onStorage);
    crossTabListeners.delete(listener);
  };
}
