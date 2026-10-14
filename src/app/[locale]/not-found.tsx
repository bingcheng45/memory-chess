import type { Metadata } from "next";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { LabMessagePage } from "@/components/lab-paper/LabMessagePage";

/**
 * Static on purpose: not-found metadata has no params, and reading the locale from the request here turns every
 * statically rendered page that calls notFound(), such as an unknown article, into a runtime error.
 */
export const metadata: Metadata = { robots: { index: false, follow: true } };

export default function NotFound() {
  const t = useTranslations("errorPages");

  return (
    <>
      {/* Next 15.2 draws a page-thrown 404 in the browser from an empty error shell that carries no metadata title. */}
      <title>{`${t("notFound.title")} | Memory Chess`}</title>
      <LabMessagePage kicker="404" heading={t("notFound.heading")} body={t("notFound.body")}>
        <Link href="/game" className="lab-btn lab-btn-primary">
          {t("play")}
        </Link>
        <Link href="/" className="lab-btn lab-btn-secondary">
          {t("home")}
        </Link>
      </LabMessagePage>
    </>
  );
}
