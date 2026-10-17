"use client";

import { useSyncExternalStore, type ReactNode } from "react";
import { NextIntlClientProvider, useLocale, useMessages, useTimeZone } from "next-intl";

const noSubscription = () => () => {};
const browserZone = () => Intl.DateTimeFormat().resolvedOptions().timeZone;
const serverZone = () => undefined;

/**
 * The locale layout's provider carries the server's time zone (UTC in production) to every client formatter. This
 * puts the viewer's own zone in its place for what is under it. Hydration renders with the parent's zone, as the
 * server did, and the browser's zone applies on the next render, so the two never disagree.
 */
export default function ViewerTimeZoneProvider({ children }: { children: ReactNode }) {
  const locale = useLocale();
  const messages = useMessages();
  const inherited = useTimeZone();
  const timeZone = useSyncExternalStore(noSubscription, browserZone, serverZone) ?? inherited;

  return (
    <NextIntlClientProvider locale={locale} messages={messages} timeZone={timeZone}>
      {children}
    </NextIntlClientProvider>
  );
}
