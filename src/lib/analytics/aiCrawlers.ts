import { POSTHOG_PROJECT_KEY } from "@/lib/analytics/posthogKey";
import { withoutTypedText } from "@/lib/analytics/typedText";

/**
 * AI crawlers and agents run no JavaScript, so the browser SDK never sees them. The middleware reports each page or
 * text file they fetch to PostHog as an `ai_crawler_visit`. The user-agent list follows the one @databuddy/sdk/agents
 * used before PostHog replaced it, so counts carry on comparably.
 */
const AI_AGENT_USER_AGENT = /Claude-User \(claude-code\/|Google-Gemini-CLI\/|Aider\/[\d.]+ \+https:\/\/aider\.chat|^Zed\/[\d.]+ \(|^opencode$|\bDevin\/\d|\bv0bot\b|Manus-User|Trae-Agent|GoogleAgent-URLContext|LinerBot|Shap-User|cohere-training-data-crawler|DeepSeekBot|PanguBot|ChatGLM-Spider|GoogleOther|AISearchBot|CCBot|Applebot|omgili|ICC-Crawler|Diffbot\/|VelenPublicWebCrawler|Bytespider|Amazonbot|PetalBot|GPTBot|ChatGPT-User|YouBot|ImagesiftBot|PerplexityBot\/|[cC]laude(?:[bB]ot|-[Ww]eb)|Claude-User|Claude-SearchBot|AI2Bot\s|Ai2Bot-Dolma|FriendlyCrawler|Google-CloudVertexBot|[Mm]eta-[Ee]xternal[Aa]gent|meta-externalfetcher|OAI-SearchBot|Timpibot|webzio-extended|cohere-ai|iaskspider|img2dataset|TikTokSpider|Perplexity-?User|SBIntuitionsBot\/|Google-(?:GeminiNotebook|NotebookLM)|Google-Agent|Gemini-Deep-Research|meta-webindexer|anthropic-ai|MistralAI-User|MistralAI-Index|MistralAI-Training|DuckAssistBot|FirecrawlAgent|Cloudflare-(?:AI-Search|AutoRAG)|TavilyBot|ShapBot|ZanistaBot|kagi-fetcher|Brightbot|atlassian-bot|AzureAI-SearchBot|Amzn-SearchBot|Amzn-User|Amazon-Bedrock-AgentCore-Browser|Anomura\/|ApifyBot|Channel3Bot|imageSpider|laion-huggingface-processor|LinkupBot|PhindBot|Flyriverbot|crawl4ai|Mozilla-Tabstack|ExaSearchBot|KimiBot|Kimi-User|Kimi-SearchBot|Crawlspace/;
const ASSET_PATH = /^\/_next\/|\.(?:js|mjs|css|map|png|jpe?g|gif|webp|avif|svg|ico|woff2?|ttf|otf|eot|mp4|webm|mp3|wav|pdf|zip)$/i;
const MARKDOWN_FIRST = /^\s*text\/(?:x-)?markdown\b/i;
const POSTHOG_CAPTURE_URL = "https://us.i.posthog.com/i/v0/e/";
const MAX_HEADER_LENGTH = 512;
const TIMEOUT_MS = 3000;

export type AiCrawlerVisit = {
  agent: string;
  path: string;
  format: "llms" | "markdown" | "html";
  referrer?: string;
};

/** The visit to report, or null for a browser, a non-page request or a file such as an image. */
export function aiCrawlerVisit(request: Request): AiCrawlerVisit | null {
  if (request.method !== "GET" && request.method !== "HEAD") return null;
  const { pathname } = new URL(request.url);
  if (ASSET_PATH.test(pathname)) return null;

  const userAgent = request.headers.get("user-agent") ?? "";
  const signatureAgent = request.headers.get("signature-agent") ?? "";
  const accept = request.headers.get("accept") ?? "";
  const markdownClient = MARKDOWN_FIRST.test(accept.split(",")[0] ?? "") && !request.headers.has("sec-fetch-mode");
  const named = userAgent.match(AI_AGENT_USER_AGENT)?.[0];
  if (!named && !signatureAgent && !markdownClient) return null;

  const agent = (named ?? (signatureAgent || "markdown client")).trim().slice(0, MAX_HEADER_LENGTH);
  const format = /\/llms(-full)?\.txt$/i.test(pathname) ? "llms" : /\.mdx?$/i.test(pathname) || MARKDOWN_FIRST.test(accept) ? "markdown" : "html";
  const referrer = request.headers.get("referer");
  return { agent, path: pathname, format, ...(referrer ? { referrer: withoutTypedText(referrer).slice(0, 2048) } : {}) };
}

/** Sends the visit to PostHog without a person profile; one anonymous id per agent keeps unique counts meaningful. */
export async function reportAiCrawlerVisit(request: Request): Promise<void> {
  const visit = aiCrawlerVisit(request);
  if (!visit) return;
  try {
    await fetch(POSTHOG_CAPTURE_URL, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        api_key: POSTHOG_PROJECT_KEY,
        event: "ai_crawler_visit",
        distinct_id: `ai-crawler:${visit.agent}`,
        properties: { ...visit, $host: new URL(request.url).host, $process_person_profile: false },
      }),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
  } catch {
    // A lost count must never break or slow the page; the request has already been answered.
  }
}
