import type { Metadata } from "next";
import { metadata as about } from "@/app/[locale]/about/page";
import { generateMetadata as changelog } from "@/app/[locale]/changelog/page";
import { metadata as privacy } from "@/app/[locale]/privacy/page";
import { metadata as terms } from "@/app/[locale]/terms/page";

const SOCIAL_IMAGE_URL = "https://thememorychess.com/social-preview.png";

describe.each<[string, Metadata]>([
  ["/about", about],
  ["/terms", terms],
  ["/privacy", privacy],
  ["/changelog", changelog()],
])("%s social metadata", (path, metadata) => {
  it("shares the site artwork as a large card on its own URL", () => {
    expect(metadata.openGraph).toMatchObject({
      url: `https://thememorychess.com${path}`,
      images: [expect.objectContaining({ url: SOCIAL_IMAGE_URL, width: 1200, height: 630 })],
    });
    expect(metadata.twitter).toMatchObject({
      card: "summary_large_image",
      images: [expect.objectContaining({ url: SOCIAL_IMAGE_URL })],
    });
  });
});
