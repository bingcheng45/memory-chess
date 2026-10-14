import { useTranslations } from "next-intl";
import { CommunityInvite } from "./CommunityLink";

/** The About page's invite. It lives outside the page's gated, translated text, so its words come from the message catalogue. */
export function AboutCommunityInvite() {
  const t = useTranslations("common.community");
  return <CommunityInvite placement="about" line={t("aboutLine")} link={t("link")} />;
}
