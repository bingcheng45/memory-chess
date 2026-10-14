"use client";

import Footer from "@/components/ui/Footer";
import { useIsLabPaperRoute } from "@/lib/lab-paper/useIsLabPaperRoute";
import { LabPaperFooter } from "./LabPaperFooter";

/** The locale layout's footer: Lab Paper on a route in the registry, the dark site footer everywhere else. */
export default function SiteFooter() {
  return useIsLabPaperRoute() ? <LabPaperFooter /> : <Footer />;
}
