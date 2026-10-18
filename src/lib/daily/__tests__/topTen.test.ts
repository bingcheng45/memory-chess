import { readDailyTop, type DailyBoardRead } from "@/lib/daily/topTen";
import type { LeaderboardEntry } from "@/types/leaderboard";

const ADA = { id: "3c3c3c3c-0000-4000-8000-000000000001", player_name: "Ada" } as LeaderboardEntry;
const BO = { id: "3c3c3c3c-0000-4000-8000-000000000002", player_name: "Bo" } as LeaderboardEntry;

function boards(byDay: Record<string, DailyBoardRead | null>) {
  const asked: string[] = [];
  const read = async (day: string) => {
    asked.push(day);
    return byDay[day] ?? null;
  };
  return { asked, read };
}

describe("the daily top 10 a reader sees", () => {
  it("is today's board once anyone has joined it, without reading yesterday's", async () => {
    const { asked, read } = boards({ "2026-10-18": { day: "2026-10-18", rows: [ADA], playedLike: 1180 } });

    expect(await readDailyTop("2026-10-18", read)).toEqual({ day: "2026-10-18", rows: [ADA], playedLike: 1180 });
    expect(asked).toEqual(["2026-10-18"]);
  });

  it("is yesterday's board while nobody has joined today's, across a month boundary", async () => {
    const { asked, read } = boards({
      "2026-11-01": { day: "2026-11-01", rows: [], playedLike: null },
      "2026-10-31": { day: "2026-10-31", rows: [BO], playedLike: 1340 },
    });

    expect(await readDailyTop("2026-11-01", read)).toEqual({ day: "2026-10-31", rows: [BO], playedLike: 1340 });
    expect(asked).toEqual(["2026-11-01", "2026-10-31"]);
  });

  it("is today's empty board when yesterday's is empty too", async () => {
    const { read } = boards({
      "2026-10-18": { day: "2026-10-18", rows: [], playedLike: null },
      "2026-10-17": { day: "2026-10-17", rows: [], playedLike: null },
    });

    expect(await readDailyTop("2026-10-18", read)).toEqual({ day: "2026-10-18", rows: [], playedLike: null });
  });

  it("is today's empty board when yesterday's cannot be read", async () => {
    const { read } = boards({ "2026-10-18": { day: "2026-10-18", rows: [], playedLike: null } });

    expect(await readDailyTop("2026-10-18", read)).toEqual({ day: "2026-10-18", rows: [], playedLike: null });
  });

  it("is nothing when today's board cannot be read", async () => {
    const { asked, read } = boards({});

    expect(await readDailyTop("2026-10-18", read)).toBeNull();
    expect(asked).toEqual(["2026-10-18"]);
  });
});
