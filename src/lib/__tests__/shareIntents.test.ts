import { SHARE_NETWORKS } from "@/lib/shareIntents";

const POST = { text: "My Memory Chess progress: memory span 8 pieces & 12 days in a row. Can you beat it?", url: "https://thememorychess.com/share/progress/1_s8_k12?utm_source=share&utm_medium=dashboard" };
const TEXT = "My%20Memory%20Chess%20progress%3A%20memory%20span%208%20pieces%20%26%2012%20days%20in%20a%20row.%20Can%20you%20beat%20it%3F";
const URL_ = "https%3A%2F%2Fthememorychess.com%2Fshare%2Fprogress%2F1_s8_k12%3Futm_source%3Dshare%26utm_medium%3Ddashboard";

describe("SHARE_NETWORKS", () => {
  it("opens each network's official compose or share page with the caption and the card's own link encoded", () => {
    expect(Object.fromEntries(SHARE_NETWORKS.map(({ id, intent }) => [id, intent(POST)]))).toEqual({
      x: `https://x.com/intent/post?text=${TEXT}&url=${URL_}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${URL_}`,
      linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${URL_}`,
      reddit: `https://www.reddit.com/submit?url=${URL_}&title=${TEXT}`,
      whatsapp: `https://wa.me/?text=${TEXT}%20${URL_}`,
      threads: `https://www.threads.net/intent/post?text=${TEXT}%20${URL_}`,
      bluesky: `https://bsky.app/intent/compose?text=${TEXT}%20${URL_}`,
    });
  });

  it("names every network by its own brand name", () => {
    expect(SHARE_NETWORKS.map(({ name }) => name)).toEqual(["X", "Facebook", "LinkedIn", "Reddit", "WhatsApp", "Threads", "Bluesky"]);
  });
});
