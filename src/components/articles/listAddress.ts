import { DEFAULT_SORT, parseSortKey, type SortKey } from "@/lib/articles/sorting";

export const FIRST_PAGE = 1;

const PAGE_PARAM = "page";
const SORT_PARAM = "sort";

const listeners = new Set<() => void>();

export function notifyAddressListeners(): void {
  listeners.forEach((notify) => notify());
}

export function subscribeToAddress(onChange: () => void): () => void {
  listeners.add(onChange);
  window.addEventListener("popstate", onChange);
  return () => {
    listeners.delete(onChange);
    window.removeEventListener("popstate", onChange);
  };
}

export function readPage(): number {
  const requested = new URLSearchParams(window.location.search).get(PAGE_PARAM);
  return requested === null ? FIRST_PAGE : Number(requested);
}

export function readSort(): SortKey {
  return parseSortKey(new URLSearchParams(window.location.search).get(SORT_PARAM));
}

function replaceAddress(change: (params: URLSearchParams) => void): void {
  const url = new URL(window.location.href);
  change(url.searchParams);
  window.history.replaceState(null, "", `${url.pathname}${url.search}${url.hash}`);
  notifyAddressListeners();
}

function setOrDrop(params: URLSearchParams, name: string, value: string, defaultValue: string): void {
  if (value === defaultValue) params.delete(name);
  else params.set(name, value);
}

export function writePage(page: number): void {
  replaceAddress((params) => setOrDrop(params, PAGE_PARAM, String(page), String(FIRST_PAGE)));
}

export function writeSort(sort: SortKey): void {
  replaceAddress((params) => {
    setOrDrop(params, SORT_PARAM, sort, DEFAULT_SORT);
    params.delete(PAGE_PARAM);
  });
}
