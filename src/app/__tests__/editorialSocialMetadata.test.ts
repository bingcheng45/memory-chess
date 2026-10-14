import type { Metadata } from "next";
import { generateMetadata as about } from "@/app/[locale]/about/page";
import { generateMetadata as changelog } from "@/app/[locale]/changelog/page";
import { generateMetadata as privacy } from "@/app/[locale]/privacy/page";
import { generateMetadata as terms } from "@/app/[locale]/terms/page";

const SOCIAL_IMAGE_URL = "https://thememorychess.com/social-preview.png";

const IN_ENGLISH = { params: Promise.resolve({ locale: "en" }) };

describe.each<[string, () => Metadata | Promise<Metadata>]>([
  ["/about", () => about(IN_ENGLISH)],
  ["/terms", () => terms(IN_ENGLISH)],
  ["/privacy", () => privacy(IN_ENGLISH)],
  ["/changelog", () => changelog()],
])("%s social metadata", (path, metadataOf) => {
  it("shares the site artwork as a large card on its own URL", async () => {
    const metadata = await metadataOf();
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
