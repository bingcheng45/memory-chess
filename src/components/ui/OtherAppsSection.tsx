"use client";

import Image from "next/image";
import { useTranslations } from "next-intl";

type OtherApp = { name: string; href: string; icon: string };

const otherApps: OtherApp[] = [
  {
    name: "Tont",
    href: "https://tont.app",
    icon: "/apps/tont.png",
  },
];

function withUtm(url: string) {
  const utm = "utm_source=memory-chess&utm_medium=site&utm_campaign=other-apps";
  return url.includes("?") ? `${url}&${utm}` : `${url}?${utm}`;
}

export default function OtherAppsSection() {
  const t = useTranslations("common.otherApps");

  return (
    <section
      id="other-apps"
      className="w-full max-w-4xl mx-auto py-12 px-2 sm:px-4 md:py-16 mt-2 border-t border-bg-light"
    >
      <h2 className="text-2xl sm:text-3xl font-bold text-center mb-8 sm:mb-10 text-text-primary">
        {t("title")}
      </h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {otherApps.map((app) => (
          <a
            key={app.name}
            href={withUtm(app.href)}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-xl border border-bg-light bg-bg-card p-4 flex items-center gap-4 shadow-md transition-all hover:shadow-lg"
          >
            <div className="h-12 w-12 rounded-xl bg-white p-0.5 shadow-md ring-1 ring-black/5 overflow-hidden">
              <Image
                src={app.icon}
                alt={t("iconAlt", { name: app.name })}
                width={48}
                height={48}
                className="h-full w-full rounded-[10px] object-cover"
              />
            </div>
            <div>
              <div className="font-medium text-text-primary">{app.name}</div>
              <div className="text-sm text-text-secondary">{t("visitWebsite")}</div>
            </div>
          </a>
        ))}
      </div>
    </section>
  );
}
