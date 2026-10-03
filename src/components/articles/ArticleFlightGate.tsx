"use client";

import { useEffect, useLayoutEffect } from "react";
import { usePathname } from "@/i18n/navigation";
import { clearArrival } from "@/components/articles/articleArrival";
import { signalRouteCommit } from "@/components/articles/articleFlight";
import "./articleFlight.css";

export default function ArticleFlightGate() {
  const pathname = usePathname();

  useLayoutEffect(signalRouteCommit, [pathname]);
  useEffect(() => {
    window.addEventListener("popstate", clearArrival);
    return () => {
      window.removeEventListener("popstate", clearArrival);
      clearArrival();
    };
  }, []);

  return null;
}
