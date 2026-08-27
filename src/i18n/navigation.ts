import { createNavigation } from "next-intl/navigation";
import { routing } from "./routing";

/**
 * Locale-aware replacements for next/link and next/navigation. Importing from
 * here (rather than from next/*) keeps the active locale prefix on every
 * internal navigation without callers having to thread it manually.
 */
export const { Link, redirect, usePathname, useRouter, getPathname } =
  createNavigation(routing);
