"use client";

import { useSyncExternalStore } from "react";
import { parsePlan, parseTarget, PLAN_KEY, TARGET_KEY, type StoredPlan, type StoredTarget } from "@/lib/lab/choices";

interface ChoiceStore<T> {
  useValue(): T | null;
  set(value: T | null): void;
  /** Clears the session fallback, so tests do not depend on the order they run in. */
  reset(): void;
}

/**
 * One choice kept in localStorage, the way the week goal is: a write storage refuses is kept in memory for the rest of
 * the session, and another tab's change arrives as a storage event. Snapshots are cached by the stored text, so React
 * sees the same object until the value really changes.
 */
function choiceStore<T>(key: string, parse: (text: string | null) => T | null): ChoiceStore<T> {
  const listeners = new Set<() => void>();
  let thisSession: { readonly text: string | null } | null = null;
  let cached: { readonly text: string | null; readonly value: T | null } = { text: null, value: null };

  const readText = () => {
    if (thisSession) return thisSession.text;
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
        thisSession = null;
      } catch {
        thisSession = { text };
      }
      listeners.forEach((listener) => listener());
    },
    reset() {
      thisSession = null;
    },
  };
}

export const planChoice = choiceStore<StoredPlan>(PLAN_KEY, parsePlan);
export const targetChoice = choiceStore<StoredTarget>(TARGET_KEY, parseTarget);
