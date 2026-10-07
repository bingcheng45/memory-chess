"use client";

import { useMemo, type ReactNode } from "react";
import { NextIntlClientProvider, useLocale, useMessages, type AbstractIntlMessages } from "next-intl";

type ScopedMessagesProviderProps = {
  messages: AbstractIntlMessages;
  children: ReactNode;
};

/**
 * Adds a route's own groups to the messages of the provider above it, merged
 * one level into each namespace, so `{ home: { lab } }` joins the rest of
 * `home`.
 *
 * A nested provider's `messages` replace its parent's, so the parent's are
 * merged in here, in the browser. Only the added groups then travel in the
 * layout's payload and the rest of the catalogue is not sent a second time.
 * The time zone, the clock and the formats come from the parent provider.
 */
export default function ScopedMessagesProvider({ messages, children }: ScopedMessagesProviderProps) {
  const locale = useLocale();
  const shared = useMessages();
  const merged = useMemo(() => {
    const added = Object.entries(messages).map(([namespace, groups]) => {
      const current = shared[namespace];
      return [namespace, typeof current === "object" && typeof groups === "object" ? { ...current, ...groups } : groups];
    });
    return { ...shared, ...Object.fromEntries(added) };
  }, [shared, messages]);

  return (
    <NextIntlClientProvider locale={locale} messages={merged}>
      {children}
    </NextIntlClientProvider>
  );
}
