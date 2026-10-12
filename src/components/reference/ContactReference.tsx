import { getTranslations } from "next-intl/server";

import {
  CONTACT_INQUIRY_KEYS,
  getReferenceProse,
} from "@/lib/reference/prose";

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
    <section aria-labelledby="contact-reference-title" className="lab-read-sec lab-contact-reference">
      <h2 id="contact-reference-title">{prose.heading}</h2>
      <div className="lab-prose">
        <p>{prose.body}</p>
        <p>{prose.typesIntro}</p>
        <ul>
          {CONTACT_INQUIRY_KEYS.map((key) => (
            <li key={key}>
              <strong>{t(key)}.</strong> {prose.types[key]}
            </li>
          ))}
        </ul>
        <p className="lab-contact-note">{prose.privacyNote}</p>
      </div>
    </section>
  );
}
