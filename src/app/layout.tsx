import type { ReactNode } from "react";

/**
 * The locale layout draws the document. This pass-through root exists so app/not-found.tsx can answer the paths the
 * middleware never routes to a locale (next-intl's documented setup).
 */
export default function RootLayout({ children }: { children: ReactNode }) {
  return children;
}
