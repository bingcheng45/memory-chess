"use client";

import { useSyncExternalStore } from "react";
import { parsePlan, parseTarget, PLAN_KEY, TARGET_KEY, type StoredPlan, type StoredTarget } from "@/lib/lab/choices";
import { ENTRIES_KEY, parseEntries, type StoredEntries } from "@/lib/lab/entries";

interface ChoiceStore<T> {
  useValue(): T | null;
  set(value: T | null): void;
  /** Clears the session fallback, so tests do not depend on the order they run in. */
  reset(): void;
}

/**
 * One choice kept in localStorage: a write storage refuses is kept in memory for the rest of the session, and another
 * tab's change arrives as a storage event. Snapshots are cached by the stored text, so React sees the same object until
 * the value really changes.
 */
export function choiceStore<T>(key: string, parse: (text: string | null) => T | null): ChoiceStore<T> {
  const listeners = new Set<() => void>();
  /** Undefined until a write fails; then the text that write meant to store. */
  let thisSession: string | null | undefined;
  let cached: { readonly text: string | null; readonly value: T | null } = { text: null, value: null };

  const readText = () => {
    if (thisSession !== undefined) return thisSession;
    try {
      return window.localStorage.getItem(key);
    } catch {
      return null;
    }
  };
  const snapshot = () => {
    const text = readText();
    if (text !== cached.text) cached = { text, value: parse(text) };
    return cached.value;
  };
  const subscribe = (onChange: () => void) => {
    const onStorage = (event: StorageEvent) => {
      if (event.key === key || event.key === null) onChange();
    };
    listeners.add(onChange);
    window.addEventListener("storage", onStorage);
    return () => {
      listeners.delete(onChange);
      window.removeEventListener("storage", onStorage);
    };
  };

  return {
    useValue: () => useSyncExternalStore(subscribe, snapshot, () => null),
    set(value) {
      const text = value === null ? null : JSON.stringify(value);
      try {
        if (text === null) window.localStorage.removeItem(key);
        else window.localStorage.setItem(key, text);
        thisSession = undefined;
      } catch {
        thisSession = text;
      }
      listeners.forEach((listener) => listener());
    },
    reset() {
      thisSession = undefined;
    },
  };
}

export const planChoice = choiceStore<StoredPlan>(PLAN_KEY, parsePlan);
export const targetChoice = choiceStore<StoredTarget>(TARGET_KEY, parseTarget);
export const entriesChoice = choiceStore<StoredEntries>(ENTRIES_KEY, parseEntries);
