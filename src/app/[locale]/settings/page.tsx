'use client';

import React from 'react';
import { useSettingsStore } from '@/stores/settingsStore';
import { Link, useRouter } from "@/i18n/navigation";
import PageHeader from '@/components/ui/PageHeader';

import { useTranslations } from "next-intl";
export default function SettingsPage() {
  const t = useTranslations("settings");
  // Difficulty names come from the game namespace so settings and game config
  // never show two different words for the same level.
  const tg = useTranslations("game");
  const router = useRouter();
  const {
    difficulty,
    memorizationTime,
    showCoordinates,
    setDifficulty,
    setMemorizationTime,
    setShowCoordinates
  } = useSettingsStore();

  const handleBack = () => {
    router.push('/');
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-center mb-8">
          <PageHeader onBackClick={handleBack} pageType="other" />
        </div>
        
        <div className="max-w-md mx-auto bg-gray-800 rounded-lg p-6 shadow-lg min-h-[400px] w-full">
          <div className="mb-8">
            <label className="block text-gray-300 mb-3 font-medium">{t("difficulty")}</label>
            <div className="flex flex-col sm:flex-row gap-2">
              {(['easy', 'medium', 'hard'] as const).map((level) => (
                <button
                  key={level}
                  className={`px-4 py-3 rounded-md flex-1 ${
                    difficulty === level
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                  onClick={() => setDifficulty(level)}
                >
                  {tg(`presets.${level}.label`)}
                </button>
              ))}
            </div>
          </div>
          
          <div className="mb-8">
            <label className="block text-gray-300 mb-3 font-medium">
              {t("memorizationTime", { seconds: memorizationTime })}
            </label>
            <input
              type="range"
              min="5"
              max="30"
              step="5"
              value={memorizationTime}
              onChange={(e) => setMemorizationTime(Number(e.target.value))}
              className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
            />
            <div className="flex justify-between text-xs text-gray-400 mt-2">
              <span>{t("seconds", { seconds: 5 })}</span>
              <span>{t("seconds", { seconds: 30 })}</span>
            </div>
          </div>
          
          <div className="mb-8">
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
          
          <div className="flex flex-col sm:flex-row justify-between gap-4 mt-12">
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