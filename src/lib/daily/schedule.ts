import { parseUtcDay, utcDayOf } from "@/lib/lab/daily";
import { DAY_MS } from "@/lib/lab/readiness";
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

export interface Band {
  readonly pieces: Range;
  readonly seconds: Range;
}

type Weekday = "sunday" | "monday" | "tuesday" | "wednesday" | "thursday" | "friday" | "saturday";

export type WeeklyArc = Readonly<Record<Weekday, Band>>;

const WEEKDAYS: readonly Weekday[] = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];

const exactly = (value: number): Range => ({ min: value, max: value });

export const WEEKLY_ARC: WeeklyArc = {
  monday: { pieces: { min: 4, max: 5 }, seconds: exactly(12) },
  tuesday: { pieces: { min: 5, max: 6 }, seconds: exactly(10) },
  wednesday: { pieces: { min: 6, max: 7 }, seconds: exactly(10) },
  thursday: { pieces: { min: 7, max: 8 }, seconds: exactly(9) },
  friday: { pieces: { min: 8, max: 9 }, seconds: exactly(8) },
  saturday: { pieces: { min: 6, max: 12 }, seconds: { min: 2, max: 6 } },
  sunday: { pieces: { min: 12, max: 32 }, seconds: exactly(12) },
};

export const MAX_LOOKBACK_DAYS = 7;

export const isUtcDay = (day: string): boolean => parseUtcDay(day) !== null;

export class InvalidDayError extends RangeError {
  override name = "InvalidDayError";

  constructor(day: string) {
    super(`Not a UTC day in YYYY-MM-DD form: "${day}"`);
  }
}

const seedOf = (label: string) => Number.parseInt(positionId(label).slice(-8), 16);

export const dailySeed = (day: string) => seedOf(`daily ${day}`);

const valuesIn = ({ min, max }: Range) => Array.from({ length: max - min + 1 }, (_, index) => min + index);

export const settingsIn = (band: Band): DailySetting[] =>
  valuesIn(band.pieces).flatMap((pieceCount) => valuesIn(band.seconds).map((memorizeTime) => ({ pieceCount, memorizeTime })));

const overlaps = (a: Range, b: Range) => a.min <= b.max && b.min <= a.max;

export const bandsOverlap = (a: Band, b: Band) => overlaps(a.pieces, b.pieces) && overlaps(a.seconds, b.seconds);

const sameSetting = (a: DailySetting, b: DailySetting) => a.pieceCount === b.pieceCount && a.memorizeTime === b.memorizeTime;

const pick = <T>(items: readonly T[], random: () => number): T => items[Math.floor(random() * items.length)];

const assertArc = (arc: WeeklyArc) => {
  for (const weekday of WEEKDAYS) {
    const { pieces, seconds } = arc[weekday];
    if (pieces.min > pieces.max) throw new RangeError(`${weekday} pieces band has min ${pieces.min} above max ${pieces.max}`);
    if (seconds.min > seconds.max) throw new RangeError(`${weekday} seconds band has min ${seconds.min} above max ${seconds.max}`);
  }
};

const yesterdayOf = (day: string) => utcDayOf(Date.parse(`${day}T00:00:00Z`) - DAY_MS);

export function scheduleOf(arc: WeeklyArc): (day: string) => DailySetting {
  assertArc(arc);
  const bandOf = (day: string): Band => arc[WEEKDAYS[new Date(`${day}T00:00:00Z`).getUTCDay()]];

  function settingOf(day: string, lookback: number): DailySetting {
    const band = bandOf(day);
    const settings = settingsIn(band);
    const random = seededRandom(seedOf(`daily-setting ${day}`));
    const drawn = pick(settings, random);
    const yesterday = yesterdayOf(day);
    if (lookback === 0 || !bandsOverlap(bandOf(yesterday), band)) return drawn;
    const before = settingOf(yesterday, lookback - 1);
    const others = settings.filter((setting) => !sameSetting(setting, before));
    return sameSetting(drawn, before) && others.length > 0 ? pick(others, random) : drawn;
  }

  return (day) => {
    if (!isUtcDay(day)) throw new InvalidDayError(day);
    return settingOf(day, MAX_LOOKBACK_DAYS);
  };
}

export const dailySettingOf = scheduleOf(WEEKLY_ARC);
