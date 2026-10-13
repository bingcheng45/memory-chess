'use client';

import { useLocale, useTranslations } from 'next-intl';
import { dailySettingOf } from '@/lib/daily/schedule';
import { msToNextUtcDay } from '@/lib/lab/daily';

const clockOf = (locale: string, at: number, timeZone?: string) =>
  new Intl.DateTimeFormat(locale, { hour: '2-digit', minute: '2-digit', hourCycle: 'h23', timeZone }).format(at);

/** The day's setting and its reset. The local time and the time left need the viewer's clock, so the line holds its height until they arrive. */
export function DailyResetNote({ day, now }: { day: string; now: number | null }) {
  const t = useTranslations('leaderboard.daily');
  const td = useTranslations('daily.page');
  const locale = useLocale();
  const setting = dailySettingOf(day);
  const utc = clockOf(locale, Date.parse(day), 'UTC');

  let reset = t('resetsAtUtc', { utc });
  if (now !== null) {
    const left = msToNextUtcDay(now);
    const minutes = Math.floor(left / 60_000);
    reset = t('resetsAt', { utc, local: clockOf(locale, now + left), hours: Math.floor(minutes / 60), minutes: minutes % 60 });
  }

  return (
    <div className="lb-daily">
      <p className="lb-daily-setting">
        {td('pieces', { count: setting.pieceCount })} · {td('seconds', { count: setting.memorizeTime })}
      </p>
      <p className="lb-daily-reset">{reset}</p>
    </div>
  );
}
