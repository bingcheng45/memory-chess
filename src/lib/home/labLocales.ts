/**
 * Locales whose catalogue carries the full `home.lab` namespace. The homepage
 * serves them the Brain Lab and every other locale the earlier homepage, so no
 * locale shows untranslated English. scripts/validate-messages.mjs imports
 * this file directly, so it must stay free of path aliases and imports.
 */
export const LAB_LOCALES: readonly string[] = ["en", "de", "es", "fr", "pt-BR", "ro", "ru", "cs", "ja", "ko", "zh-CN", "zh-TW", "sv", "no", "tr", "id", "nl"];

export function hasLabCopy(locale: string): boolean {
  return LAB_LOCALES.includes(locale);
}
