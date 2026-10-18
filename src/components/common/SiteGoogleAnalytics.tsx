import Script from "next/script";

export const GA_MEASUREMENT_ID = "G-R8BM9EMY9J";
export const GA_SCRIPT_URL = `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`;

/**
 * The stub gtag.js documents. Events sent before the library arrives wait in dataLayer and replay once it loads.
 * gtag.js reads location only once it loads, by which time the visitor may have left the landing URL and its
 * campaign tags, so the first page_view sends the landing address, referrer and title itself.
 */
export const GA_INIT_SNIPPET = `window.dataLayer = window.dataLayer || [];
function gtag(){window.dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', '${GA_MEASUREMENT_ID}', { send_page_view: false });
gtag('event', 'page_view', { page_location: location.href, page_referrer: document.referrer, page_title: document.title });`;

/**
 * @next/third-parties preloads the 191 KB library in <head>, where it competes with the app's own scripts.
 * Here the library loads after the page's load event instead, and nothing is lost: page views and events queue.
 */
export default function SiteGoogleAnalytics() {
  return (
    <>
      <script id="_ga-init" dangerouslySetInnerHTML={{ __html: GA_INIT_SNIPPET }} />
      <Script id="_ga" src={GA_SCRIPT_URL} strategy="lazyOnload" />
    </>
  );
}
