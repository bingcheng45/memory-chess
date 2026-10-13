'use client';

import { useLocale, useTranslations } from 'next-intl';
import type { TimeLeft } from '@/hooks/useDailyState';
import { dailySettingOf } from '@/lib/daily/schedule';
import { DAY_MS } from '@/lib/lab/readiness';

const clockOf = (locale: string, at: number, timeZone?: string) =>
  new Intl.DateTimeFormat(locale, { hour: '2-digit', minute: '2-digit', hourCycle: 'h23', timeZone }).format(at);

export function DailyResetNote({ day, left }: { day: string; left: TimeLeft | null }) {
  const t = useTranslations('leaderboard.daily');
  const te = useTranslations('dailyEntry');
  const locale = useLocale();
  const setting = dailySettingOf(day);
  const resetAt = Date.parse(day) + DAY_MS;
  const utc = clockOf(locale, resetAt, 'UTC');

  let reset = t('resetsAtUtc', { utc });
  if (left !== null) {
    const { hours, minutes } = left;
    const timeLeft = hours > 0 ? te('hoursLeft', { hours, minutes }) : minutes > 0 ? te('minutesLeft', { minutes }) : te('underMinute');
    reset = t('resetsAt', { utc, local: clockOf(locale, resetAt), timeLeft });
  }

  return (
    <div className="lb-daily">
      <p className="lb-daily-setting">{t('setting', { pieces: setting.pieceCount, seconds: setting.memorizeTime })}</p>
      <p className="lb-daily-reset">{reset}</p>
    </div>
  );
}
