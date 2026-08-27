import type { ReactElement, ReactNode } from "react";
import { render as rtlRender, type RenderOptions } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { DEFAULT_LOCALE } from "@/i18n/routing";
import messages from "../../messages/en.json";

/**
 * Test render that supplies the intl context.
 *
 * Anything importing `Link`/`useRouter` from `@/i18n/navigation`, or calling
 * `useTranslations`, needs a provider above it or it throws at render. Tests
 * assert on English copy, so the provider is pinned to the default locale
 * rather than parameterised.
 */
type IntlOptions = Omit<RenderOptions, "wrapper"> & {
  /** Override when a test needs a non-English catalogue, e.g. to prove a
   * component reads its copy from messages rather than hard-coding English. */
  locale?: string;
  messages?: Record<string, unknown>;
};

export function renderWithIntl(ui: ReactElement, options?: IntlOptions) {
  const {
    locale = DEFAULT_LOCALE,
    messages: localeMessages = messages,
    ...renderOptions
  } = options ?? {};

  function IntlWrapper({ children }: { children: ReactNode }) {
    return (
      <NextIntlClientProvider locale={locale} messages={localeMessages}>
        {children}
      </NextIntlClientProvider>
    );
  }

  return rtlRender(ui, { wrapper: IntlWrapper, ...renderOptions });
}

export * from "@testing-library/react";
// Shadow RTL's render so a file can swap its import path and nothing else.
export { renderWithIntl as render };
