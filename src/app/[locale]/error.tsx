"use client";

import { useEffect } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { LabMessagePage } from "@/components/lab-paper/LabMessagePage";

interface ErrorPageProps {
  readonly error: Error & { digest?: string };
  readonly reset: () => void;
}

/** What a page that threw while rendering shows instead, inside the locale layout's banner and footer. */
export default function ErrorPage({ error, reset }: ErrorPageProps) {
  const t = useTranslations("errorPages");

  useEffect(() => {
    console.error("A page failed to render", error);
  }, [error]);

  return (
    <>
      <title>{`${t("error.title")} | Memory Chess`}</title>
      <LabMessagePage heading={t("error.heading")} body={t("error.body")}>
        <button type="button" className="lab-btn lab-btn-primary" onClick={reset}>
          {t("error.retry")}
        </button>
        <Link href="/" className="lab-btn lab-btn-secondary">
          {t("home")}
        </Link>
      </LabMessagePage>
    </>
  );
}
