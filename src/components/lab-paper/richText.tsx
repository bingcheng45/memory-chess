import { createTranslator, type RichTranslationValues } from "next-intl";
import type { ReactNode } from "react";

const MESSAGE_KEY = "message";

/**
 * One ICU message rendered as React nodes: each rich tag through its function in `values`, each placeholder from
 * `values`. A message that does not compile, or names a tag or a value it is not given, throws instead of printing
 * a fallback.
 */
export function richText(message: string, locale: string, values: RichTranslationValues): ReactNode {
  const t = createTranslator({
    locale,
    messages: { [MESSAGE_KEY]: message },
    onError: (error) => {
      throw error;
    },
  });
  return t.rich(MESSAGE_KEY, values);
}
