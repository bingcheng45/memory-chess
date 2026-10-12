'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { LabPaperHeader } from '@/components/lab-paper/LabPaperHeader';
import { LAB_PAPER_CLASS } from '@/components/lab-paper/shell';
import { CoordinatesSwitch } from '@/components/settings/CoordinatesSwitch';
import './settings.css';

export default function SettingsPage() {
  const t = useTranslations('settings');
  // Null until the reader changes something: the status line confirms a save, it does not describe the default.
  const [saved, setSaved] = useState<boolean | null>(null);

  return (
    <div className={LAB_PAPER_CLASS}>
      <LabPaperHeader />
      <main className="lab-wrap lab-settings">
        <h1 className="lab-settings-h">{t('title')}</h1>
        <p className="lab-lede">{t('intro')}</p>

        <section className="lab-settings-card">
          <CoordinatesSwitch onChange={setSaved} />
        </section>
        <p role="status" className="lab-settings-status">
          {saved !== null && (
            <>
              <svg className="lab-settings-tick" viewBox="0 0 16 16" width="16" height="16" aria-hidden="true">
                <path d="M3 8.5 6.5 12 13 4.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              {saved ? t('savedOn') : t('savedOff')}
            </>
          )}
        </p>

        <div className="lab-settings-actions">
          <Link href="/game" className="lab-btn lab-btn-primary">
            {t('playGame')}
          </Link>
          <Link href="/" className="lab-btn lab-btn-secondary">
            {t('home')}
          </Link>
        </div>
      </main>
    </div>
  );
}
