"use client";

/**
 * The home page's server components take the shared client links and header from here, never directly.
 *
 * Next merges the home page's client manifest into every page under [locale], because a route group joins its parent's
 * group. A shared client module the home page renders straight from a server component is then mapped to the home
 * page's chunks on every page, and each page downloads them. Through this module only the home page refers to them.
 */
export { Link } from "@/i18n/navigation";
export { default as NextLink } from "next/link";
export { LabPaperHeader } from "@/components/lab-paper/LabPaperHeader";
