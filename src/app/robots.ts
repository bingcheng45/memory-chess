import type { MetadataRoute } from 'next';
import { RETIRED_SITEMAP_PATH } from '@/lib/seo/retiredUrls';

/**
 * Crawlers that copy pages to train models and send no visitors back. Each
 * read is billed by Vercel. Search and user-fetch bots (OAI-SearchBot,
 * ChatGPT-User, Claude-SearchBot, Claude-User, PerplexityBot) stay on the
 * catch-all rule, since they are how ChatGPT and Claude link to the site.
 * Google-Extended is left alone: Googlebot does the reading either way.
 */
const TRAINING_CRAWLERS = ['GPTBot', 'ClaudeBot', 'CCBot', 'meta-externalagent', 'Bytespider'];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: TRAINING_CRAWLERS,
        disallow: '/',
      },
      {
        userAgent: '*',
        allow: '/',
      },
    ],
    // The retired sitemap is temporary: see `retiredUrls`.
    sitemap: ['https://thememorychess.com/sitemap.xml', `https://thememorychess.com${RETIRED_SITEMAP_PATH}`],
    host: 'https://thememorychess.com',
  };
}
