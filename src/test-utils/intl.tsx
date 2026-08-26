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
function IntlWrapper({ children }: { children: ReactNode }) {
  return (
    <NextIntlClientProvider locale={DEFAULT_LOCALE} messages={messages}>
      {children}
    </NextIntlClientProvider>
  );
}

export function renderWithIntl(
  ui: ReactElement,
  options?: Omit<RenderOptions, "wrapper">,
) {
  return rtlRender(ui, { wrapper: IntlWrapper, ...options });
}

export * from "@testing-library/react";
// Shadow RTL's render so a file can swap its import path and nothing else.
export { renderWithIntl as render };
