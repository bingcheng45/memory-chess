/** @jest-environment <rootDir>/src/test-utils/machineZoneEnvironment.ts */
import type { ComponentType, ReactNode } from "react";
import { render, screen } from "@/test-utils/intl";
import { PRIVACY_LAST_UPDATED } from "@/lib/seo/privacyPolicy";

declare const setMachineTimeZone: (zone: string) => void;

jest.mock("@/lib/seo/privacyPolicy", () => ({ PRIVACY_LAST_UPDATED: "2031-01-09T00:00:00.000+08:00" }));

jest.mock("@/components/ui/PageHeader", () => {
  function MockPageHeader() {
    return <div>Memory Chess header</div>;
  }

  return MockPageHeader;
});

jest.mock("@/i18n/navigation", () => ({
  Link: ({ href, children, ...rest }: { href: string; children?: ReactNode }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

function importPageInMachineZone(): ComponentType {
  let page: ComponentType | undefined;
  jest.isolateModules(() => {
    page = jest.requireActual<typeof import("@/app/[locale]/privacy/page")>("@/app/[locale]/privacy/page").default;
  });
  if (page === undefined) throw new Error("the privacy page did not load");
  return page;
}

describe("PrivacyPage last-updated line", () => {
  it.each([
    ["UTC", "1/8/2031"],
    ["Pacific/Pago_Pago", "1/8/2031"],
    ["Pacific/Kiritimati", "1/9/2031"],
  ])(
    "prints January 9, the date the sitemap reads, on a machine in %s, where that moment is %s",
    (machineZone, dateOnMachine) => {
      setMachineTimeZone(machineZone);
      const PrivacyPage = importPageInMachineZone();

      render(<PrivacyPage />);

      expect(new Date(PRIVACY_LAST_UPDATED).toLocaleDateString("en-US")).toBe(dateOnMachine);
      expect(screen.getByText("Last updated: January 9, 2031")).toBeInTheDocument();
    },
  );
});
