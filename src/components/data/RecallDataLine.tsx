import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { RECALL_PATH } from "@/lib/data/recall";

export function RecallDataLine() {
  const t = useTranslations("data");
  return (
    <p className="lab-read-note">
      {t("aboutLine")} <Link href={RECALL_PATH}>{t("aboutLink")}</Link>
    </p>
  );
}
