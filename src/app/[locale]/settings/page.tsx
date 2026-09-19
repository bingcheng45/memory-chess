'use client';

import React from 'react';
import { useSettingsStore } from '@/stores/settingsStore';
import { Link, useRouter } from "@/i18n/navigation";
import PageHeader from '@/components/ui/PageHeader';

import { useTranslations } from "next-intl";
export default function SettingsPage() {
  const t = useTranslations("settings");
  const router = useRouter();
  const { showCoordinates, setShowCoordinates } = useSettingsStore();

  const handleBack = () => {
    router.push('/');
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="container mx-auto px-1 sm:px-4 py-8">
        <div className="flex justify-center mb-8">
          <PageHeader onBackClick={handleBack} pageType="other" />
        </div>
        
        <div className="max-w-md mx-auto bg-gray-800 rounded-lg p-6 shadow-lg min-h-[400px] w-full flex flex-col justify-between">
          <div>
            <label className="flex items-center space-x-3 cursor-pointer">
              <input
                type="checkbox"
                checked={showCoordinates}
                onChange={() => setShowCoordinates(!showCoordinates)}
                className="w-5 h-5 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-600"
              />
              <span className="text-gray-300">{t("showCoordinates")}</span>
            </label>
          </div>

          <div className="flex flex-col sm:flex-row justify-between gap-4">
            <Link
              href="/"
              className="px-4 py-3 bg-gray-700 text-gray-300 rounded-md hover:bg-gray-600 text-center"
            >{t("home")}</Link>
            <Link
              href="/game"
              className="px-4 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-center"
            >{t("playGame")}</Link>
          </div>
        </div>
      </div>
    </div>
  );
} 