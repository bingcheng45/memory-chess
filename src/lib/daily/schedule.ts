import { shiftDay } from "@/lib/lab/engine";
import { positionId } from "@/lib/lab/record";
import { seededRandom } from "@/lib/utils/seededRandom";

export interface DailySetting {
  readonly pieceCount: number;
  readonly memorizeTime: number;
}

interface Range {
  readonly min: number;
  readonly max: number;
}

interface Band {
  readonly pieces: Range;
  readonly seconds: Range;
}

type Weekday = "sunday" | "monday" | "tuesday" | "wednesday" | "thursday" | "friday" | "saturday";

/** In `Date.getUTCDay` order. */
const WEEKDAYS: readonly Weekday[] = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];

const exactly = (value: number): Range => ({ min: value, max: value });

/** Easy after the weekend, harder through the week, a flash board on Saturday and the biggest board on Sunday. */
const WEEKLY_ARC: Readonly<Record<Weekday, Band>> = {
  monday: { pieces: { min: 4, max: 5 }, seconds: exactly(12) },
  tuesday: { pieces: { min: 5, max: 6 }, seconds: exactly(10) },
  wednesday: { pieces: { min: 6, max: 7 }, seconds: exactly(10) },
  thursday: { pieces: { min: 7, max: 8 }, seconds: exactly(9) },
  friday: { pieces: { min: 8, max: 9 }, seconds: exactly(8) },
  saturday: { pieces: { min: 6, max: 12 }, seconds: { min: 2, max: 6 } },
  sunday: { pieces: { min: 12, max: 32 }, seconds: exactly(12) },
};

/** The day's seed from the stable position-id hash, so a day's setting and board never change once they are out. */
export const dailySeed = (day: string) => Number.parseInt(positionId(`daily ${day}`).slice(-8), 16);

const bandOf = (day: string): Band => WEEKLY_ARC[WEEKDAYS[new Date(`${day}T00:00:00Z`).getUTCDay()]];

const valuesIn = ({ min, max }: Range) => Array.from({ length: max - min + 1 }, (_, index) => min + index);

const settingsIn = (band: Band): DailySetting[] =>
  valuesIn(band.pieces).flatMap((pieceCount) => valuesIn(band.seconds).map((memorizeTime) => ({ pieceCount, memorizeTime })));

const overlaps = (a: Range, b: Range) => a.min <= b.max && b.min <= a.max;

const sameSetting = (a: DailySetting, b: DailySetting) => a.pieceCount === b.pieceCount && a.memorizeTime === b.memorizeTime;

const pick = <T>(items: readonly T[], random: () => number): T => items[Math.floor(random() * items.length)];

/** Only a day whose band overlaps yesterday's can draw yesterday's setting, so only then is yesterday worked out. */
function yesterdayWithin(day: string, band: Band): DailySetting | null {
  const yesterday = shiftDay(day, -1);
  const before = bandOf(yesterday);
  return overlaps(before.pieces, band.pieces) && overlaps(before.seconds, band.seconds) ? dailySettingOf(yesterday) : null;
}

/** One setting per UTC day for the whole world: the day's seed picks a point in its weekday's band, never yesterday's setting. */
export function dailySettingOf(day: string): DailySetting {
  const band = bandOf(day);
  const random = seededRandom(dailySeed(day));
  const settings = settingsIn(band);
  const drawn = pick(settings, random);
  const yesterday = yesterdayWithin(day, band);
  if (!yesterday || !sameSetting(drawn, yesterday)) return drawn;
  return pick(
    settings.filter((setting) => !sameSetting(setting, yesterday)),
    random,
  );
}
