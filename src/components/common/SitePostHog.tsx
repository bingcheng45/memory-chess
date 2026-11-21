"use client";

import { useEffect } from "react";
import { attachPostHog } from "@/lib/analytics/posthog";
import { scrubTypedText, TYPED_TEXT_PARAMS } from "@/lib/analytics/typedText";
import type { PostHogConfig } from "posthog-js";
import { POSTHOG_RELAY_PATH } from "@/lib/cloudflare/posthogRelay";
import { POSTHOG_PROJECT_KEY } from "@/lib/analytics/posthogKey";

const POSTHOG_UI_HOST = "https://us.posthog.com";

type CaptureResult = { event?: string; timestamp?: Date; properties?: Record<string, unknown>; $set?: unknown; $set_once?: unknown } | null;

/** Drops typed text (a player name or a search) from every address an event carries, as the privacy page promises. */
export function withoutTypedTextInEvent<T extends CaptureResult>(event: T): T {
  if (!event) return event;
  return { ...event, properties: scrubTypedText(event.properties), $set: scrubTypedText(event.$set), $set_once: scrubTypedText(event.$set_once) };
}

let landingPageviewSent = false;

/**
 * PostHog sends the first page view when it starts, after the page's load event, but events sent before then keep the
 * time they happened. Dating the first page view to when the page began loading keeps it ahead of them, so a round
 * started on a slow load still counts in the page view → round funnel.
 */
export function withLandingTime<T extends CaptureResult>(event: T): T {
  if (!event || event.event !== "$pageview" || landingPageviewSent) return event;
  landingPageviewSent = true;
  return { ...event, timestamp: new Date(performance.timeOrigin) };
}

/** For tests: treat the next page view as the landing one again. */
export function resetLandingPageviewForTests(): void {
  landingPageviewSent = false;
}

/**
 * What the privacy page promises, as settings: no cookies, no person profiles, no recordings, heatmaps, surveys or
 * flags, no on-screen text in clicks, and no player names or search words in any address.
 */
export const POSTHOG_OPTIONS = {
  api_host: POSTHOG_RELAY_PATH,
  ui_host: POSTHOG_UI_HOST,
  persistence: "localStorage",
  person_profiles: "identified_only",
  capture_pageview: "history_change",
  capture_pageleave: true,
  // Clicks keep their element and link, never the text on screen, which can show a player name.
  autocapture: true,
  mask_all_text: true,
  // Heatmaps key their data by the raw page address, which before_send cannot see into; keep them off here.
  capture_heatmaps: false,
  capture_dead_clicks: false,
  mask_personal_data_properties: true,
  custom_personal_data_properties: [...TYPED_TEXT_PARAMS],
  capture_exceptions: true,
  capture_performance: { web_vitals: true },
  disable_session_recording: true,
  disable_surveys: true,
  advanced_disable_flags: true,
  before_send: [withLandingTime, withoutTypedTextInEvent],
} satisfies Partial<PostHogConfig>;

export async function startPostHog(): Promise<void> {
  const { default: posthog } = await import("posthog-js");
  posthog.init(POSTHOG_PROJECT_KEY, POSTHOG_OPTIONS);
  attachPostHog(posthog);
}

/**
 * Loads PostHog once the page has loaded, so its library never competes with the app's own scripts. Events sent
 * before then wait in src/lib/analytics/posthog.ts. The layout renders this on the live site only.
 */
export default function SitePostHog() {
  useEffect(() => {
    const start = () => void startPostHog().catch((error: unknown) => console.error("PostHog failed to load", error));
    if (document.readyState === "complete") {
      start();
      return;
    }
    window.addEventListener("load", start, { once: true });
    return () => window.removeEventListener("load", start);
  }, []);

  return null;
}
