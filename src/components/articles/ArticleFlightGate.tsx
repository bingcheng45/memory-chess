"use client";

import { useEffect, useLayoutEffect } from "react";
import { usePathname } from "@/i18n/navigation";
import { clearArrival } from "@/components/articles/articleArrival";
import { signalRouteCommit } from "@/components/articles/articleFlight";
import "./articleFlight.css";

// Capture runs this before Next's own popstate listener, so the arrival is gone before the router renders.
const BEFORE_OTHER_LISTENERS = { capture: true };

export default function ArticleFlightGate() {
  const pathname = usePathname();

  useLayoutEffect(signalRouteCommit, [pathname]);
  useEffect(() => {
    window.addEventListener("popstate", clearArrival, BEFORE_OTHER_LISTENERS);
    return () => {
      window.removeEventListener("popstate", clearArrival, BEFORE_OTHER_LISTENERS);
      clearArrival();
    };
  }, []);

  return null;
}
