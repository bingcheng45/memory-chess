"use client";

import { useState } from "react";
import { Databuddy } from "@databuddy/sdk/react";

/**
 * Web Vitals were about half of Databuddy's monthly event quota. One page load in ten still gives usable
 * percentiles, and Vercel Speed Insights measures every load. Pageviews, errors and custom events stay unsampled.
 */
export const WEB_VITALS_SAMPLE_RATE = 0.1;

export default function SiteDatabuddy() {
  // Drawn in the browser: the SDK injects its script from an effect, so this is the value it reads.
  const [measuresVitals] = useState(() => Math.random() < WEB_VITALS_SAMPLE_RATE);

  return (
    <Databuddy
      clientId={process.env.NEXT_PUBLIC_DATABUDDY_CLIENT_ID}
      trackWebVitals={measuresVitals}
      trackErrors
      trackOutgoingLinks
    />
  );
}
