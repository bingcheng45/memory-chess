import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  ADSENSE_ADS_TXT_RECORD,
  ADSENSE_CLIENT_ID,
  ADSENSE_PUBLISHER_ID,
  ADSENSE_SCRIPT_URL,
} from "@/lib/adsense";

describe("AdSense configuration", () => {
  it("keeps the public publisher identifiers consistent", () => {
    expect(ADSENSE_CLIENT_ID).toBe(`ca-${ADSENSE_PUBLISHER_ID}`);
    expect(ADSENSE_SCRIPT_URL).toContain(`client=${ADSENSE_CLIENT_ID}`);

    const adsTxt = readFileSync(
      join(process.cwd(), "public", "ads.txt"),
      "utf8",
    ).trim();
    expect(adsTxt).toBe(ADSENSE_ADS_TXT_RECORD);
  });
});
