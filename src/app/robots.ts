import type { MetadataRoute } from 'next';

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
    sitemap: 'https://thememorychess.com/sitemap.xml',
    host: 'https://thememorychess.com',
  };
}
