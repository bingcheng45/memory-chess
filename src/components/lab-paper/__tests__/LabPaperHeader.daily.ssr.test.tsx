/** @jest-environment node */
import type { AnchorHTMLAttributes } from "react";
import { renderToString } from "react-dom/server";
import { NextIntlClientProvider } from "next-intl";
import { LabPaperHeader } from "@/components/lab-paper/LabPaperHeader";
import messages from "../../../../messages/en.json";

jest.mock("@/lib/articles/translatedLocales");
jest.mock("@/i18n/navigation", () => ({
  Link: ({ href, ...props }: AnchorHTMLAttributes<HTMLAnchorElement>) => <a href={href} {...props} />,
  usePathname: () => "/game",
  useRouter: () => ({ replace: jest.fn() }),
}));

it("serves no daily dot, so the served nav is the same for every visitor", () => {
  const html = renderToString(
    <NextIntlClientProvider locale="en" messages={messages}>
      <LabPaperHeader />
    </NextIntlClientProvider>,
  );

  expect(html).toContain('href="/dashboard">Dashboard</a>');
  expect(html).not.toContain("lab-daily-dot");
  expect(html).not.toContain("daily board is ready");
});
