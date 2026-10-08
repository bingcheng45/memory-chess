import { RESULT_LAB_FRAME } from "@/components/game/ResultLabSlot";
import measured from "../result-lab-heights.json";

const BREAKPOINTS = { "": 0, "sm:": 640, "lg:": 1024 } as const;

const reserves = [...RESULT_LAB_FRAME.matchAll(/(?:^|\s)(sm:|lg:)?min-h-\[(\d+)px\]/g)].map(([, prefix = "", px]) => ({
  from: BREAKPOINTS[prefix as keyof typeof BREAKPOINTS],
  px: Number(px),
}));

const reserveAt = (width: number) => reserves.filter(({ from }) => width >= from).sort((a, b) => b.from - a.from)[0].px;

describe("the result screen's lab card reserve", () => {
  it("was measured on both sides of every width its reserve changes at", () => {
    const widths = Object.keys(measured.worst).map(Number);
    const changes = reserves.map(({ from }) => from).filter((from) => from > 0);

    expect(changes).toEqual([640, 1024]);
    expect(changes.filter((at) => !(widths.includes(at) && widths.some((width) => width < at)))).toEqual([]);
  });

  it("holds the tallest card the copy can make at every measured width", () => {
    const short = Object.entries(measured.worst).flatMap(([width, height]) => {
      const reserve = reserveAt(Number(width));
      return height > reserve ? [`${width}px: reserve ${reserve}px, tallest card ${height}px`] : [];
    });

    expect(short).toEqual([]);
  });
});
