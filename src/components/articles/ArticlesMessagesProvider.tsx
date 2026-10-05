"use client";

import { useMemo, type ReactNode } from "react";
import { NextIntlClientProvider, useLocale, useMessages, type AbstractIntlMessages } from "next-intl";

type ArticlesMessagesProviderProps = {
  articles: AbstractIntlMessages[string];
  children: ReactNode;
};

/**
 * Adds the `articles` namespace to the messages of the provider above it.
 *
 * A nested provider's `messages` replace its parent's, so the parent's are
 * merged in here, in the browser. Only `articles` then travels in the
 * layout's payload and the rest of the catalogue is not sent a second time.
 * The time zone, the clock and the formats come from the parent provider.
 */
export default function ArticlesMessagesProvider({ articles, children }: ArticlesMessagesProviderProps) {
  const locale = useLocale();
  const shared = useMessages();
  const messages = useMemo(() => ({ ...shared, articles }), [shared, articles]);

  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      {children}
    </NextIntlClientProvider>
  );
}
