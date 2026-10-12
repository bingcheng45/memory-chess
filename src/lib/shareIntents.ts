export interface SharePost {
  readonly text: string;
  readonly url: string;
}

const encode = encodeURIComponent;
const textAndLink = ({ text, url }: SharePost) => encode(`${text} ${url}`);

/**
 * Each network's public compose or share page. None of them can attach an image, and Facebook and LinkedIn
 * read only the link, taking the title and picture from the page it points to.
 */
export const SHARE_NETWORKS = [
  { id: "x", name: "X", intent: ({ text, url }: SharePost) => `https://x.com/intent/post?text=${encode(text)}&url=${encode(url)}` },
  { id: "facebook", name: "Facebook", intent: ({ url }: SharePost) => `https://www.facebook.com/sharer/sharer.php?u=${encode(url)}` },
  { id: "linkedin", name: "LinkedIn", intent: ({ url }: SharePost) => `https://www.linkedin.com/sharing/share-offsite/?url=${encode(url)}` },
  { id: "reddit", name: "Reddit", intent: ({ text, url }: SharePost) => `https://www.reddit.com/submit?url=${encode(url)}&title=${encode(text)}` },
  { id: "whatsapp", name: "WhatsApp", intent: (post: SharePost) => `https://wa.me/?text=${textAndLink(post)}` },
  { id: "threads", name: "Threads", intent: (post: SharePost) => `https://www.threads.net/intent/post?text=${textAndLink(post)}` },
  { id: "bluesky", name: "Bluesky", intent: (post: SharePost) => `https://bsky.app/intent/compose?text=${textAndLink(post)}` },
] as const;

export type ShareNetwork = (typeof SHARE_NETWORKS)[number]["id"];
