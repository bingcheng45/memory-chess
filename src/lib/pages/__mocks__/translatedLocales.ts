import type { Locale } from "@/i18n/routing";

const actual = jest.requireActual<typeof import("../translatedLocales")>("../translatedLocales");

export const { PAGE_NAMES, PAGE_ROUTES, PAGE_UNITS, approvalNameOf } = actual;

export const TRANSLATED_PAGE_LOCALES: readonly Locale[] = ["de"];
