import { getTranslations } from "next-intl/server";

import { EDITORIAL_STYLES } from "@/components/editorial/editorialStyles";
import {
  getReferenceProse,
  type ContactInquiryKey,
} from "@/lib/reference/prose";

const INQUIRY_KEYS: readonly ContactInquiryKey[] = [
  "feedback",
  "featureRequest",
  "general",
  "business",
];

export default async function ContactReference({
  locale,
}: {
  locale: string;
}) {
  const prose = getReferenceProse(locale).contact;
  // The form's own option labels, so the explainer names exactly what the
  // select shows in every locale.
  const t = await getTranslations({ locale, namespace: "contact.types" });

  return (
    <section
      aria-labelledby="contact-reference-title"
      className="bg-bg-dark text-text-primary"
    >
      <div className="container mx-auto max-w-4xl px-1 sm:px-4 pb-4 pt-6">
        <div
          className={`${EDITORIAL_STYLES.readingColumn} border-t border-white/10 pt-10`}
        >
          <h2
            id="contact-reference-title"
            className={EDITORIAL_STYLES.sectionTitle}
          >
            {prose.heading}
          </h2>
          <div className={`${EDITORIAL_STYLES.body} mt-5 space-y-4`}>
            <p>{prose.body}</p>
            <p>{prose.typesIntro}</p>
          </div>
          <ul className={`${EDITORIAL_STYLES.body} mt-4 space-y-2`}>
            {INQUIRY_KEYS.map((key) => (
              <li key={key}>
                <span className="font-medium text-text-primary">{t(key)}.</span>{" "}
                {prose.types[key]}
              </li>
            ))}
          </ul>
          <p className={`${EDITORIAL_STYLES.muted} mt-6`}>
            {prose.privacyNote}
          </p>
        </div>
      </div>
    </section>
  );
}
