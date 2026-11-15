import type { AnchorHTMLAttributes } from "react";
import { render, screen } from "@/test-utils/intl";
import SharePage from "@/app/[locale]/share/[kind]/[code]/page";

jest.mock("@/i18n/navigation", () => ({
  Link: ({ href, ...props }: AnchorHTMLAttributes<HTMLAnchorElement>) => <a href={href} {...props} />,
  usePathname: () => "/share",
  useRouter: () => ({ replace: jest.fn() }),
}));

const DAILY = "1_d_4_100_84_383_75_3_4_1000_0_0_20261012";
const RESULT = "1_g_4_100_84_383_1214_d14_3_4k3-8-8-3q4-8-8-4P3-4K3_4k3-8-8-8-8-8-8-R3K3_e131e819a174";
const CLOSED = "That day's board has closed. Today's board is open now.";

const renderShare = async (kind: string, code: string) => render(await SharePage({ params: Promise.resolve({ kind, code }) }));

afterEach(() => jest.restoreAllMocks());

describe("SharePage", () => {
  it("sends a shared daily board to today's board", async () => {
    await renderShare("result", DAILY);

    expect(screen.getByRole("link", { name: "Play today's board" })).toHaveAttribute("href", "/daily");
  });

  it("says a shared daily board from another day has closed and today's is open", async () => {
    jest.spyOn(Date, "now").mockReturnValue(Date.parse("2026-10-13T00:30:00Z"));
    await renderShare("result", DAILY);

    expect(await screen.findByText(CLOSED)).toBeInTheDocument();
  });

  it("says nothing has closed on the shared board's own day", async () => {
    jest.spyOn(Date, "now").mockReturnValue(Date.parse("2026-10-12T23:30:00Z"));
    await renderShare("result", DAILY);

    expect(screen.getByRole("link", { name: "Play today's board" })).toBeInTheDocument();
    expect(screen.queryByText(CLOSED)).not.toBeInTheDocument();
  });

  it("still sends a shared round to a round at its setting, tagged as from a share", async () => {
    await renderShare("result", RESULT);

    expect(screen.getByRole("link", { name: "Play the same setting" })).toHaveAttribute("href", "/game?pieceCount=4&memorizeTime=10&from=share");
  });
});
