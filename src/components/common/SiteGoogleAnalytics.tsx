import Script from "next/script";

export const GA_MEASUREMENT_ID = "G-R8BM9EMY9J";
export const GA_SCRIPT_URL = `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`;

const GA_SESSION_TIMEOUT_SECONDS = 30 * 60;

/**
 * The stub gtag.js documents. Events sent before the library arrives wait in dataLayer and replay once it loads.
 * gtag.js reads location only once it loads, by which time the visitor may have left the landing URL and its
 * campaign tags, so the first page_view sends the landing address, referrer and title itself. A page that streams its
 * title has none yet, so gtag.js reads it later.
 *
 * GA4 starts a new session once a tab has sent nothing for 30 minutes, and credits its source and landing page to
 * the session's first event. A player who stays on /game sends only round events, so the new session would open on
 * one. The stub reads the last-hit time gtag.js keeps in its session cookie and sends a page_view first when the
 * session has lapsed, counting events still queued for gtag.js as activity so a page loading its library late sends
 * one. That page_view carries no referrer and no campaign tags, so a revived session is credited to direct, not to the
 * visit's original source. A navigation since the last hit is left to GA4's own history page view, which starts the
 * session itself and would otherwise be counted twice.
 */
export const GA_INIT_SNIPPET = `window.dataLayer = window.dataLayer || [];
(function () {
  function paramName(pair) {
    var key = pair.split('=')[0].replace(/\\+/g, ' ');
    try { key = decodeURIComponent(key); } catch (e) {}
    return key;
  }
  function isTypedText(pair) {
    var key = paramName(pair);
    return key === 'player' || key === 'q';
  }
  function isCampaignTag(pair) {
    return /^(utm_|gclid$|gbraid$|wbraid$|fbclid$|msclkid$)/.test(paramName(pair));
  }
  function withoutParams(address, isDropped) {
    if (!address) return address;
    try {
      if (new URL(address).origin !== location.origin) return address;
      var hashAt = address.indexOf('#');
      var hash = hashAt < 0 ? '' : address.slice(hashAt);
      var head = hashAt < 0 ? address : address.slice(0, hashAt);
      var queryAt = head.indexOf('?');
      if (queryAt < 0) return address;
      var pairs = head.slice(queryAt + 1).split('&');
      var kept = pairs.filter(function (pair) { return !isDropped(pair); });
      if (kept.length === pairs.length) return address;
      return head.slice(0, queryAt) + (kept.length ? '?' + kept.join('&') : '') + hash;
    } catch (e) {
      return address.split('#')[0].split('?')[0];
    }
  }
  var lastQueued = 0;
  var navigatedAt = 0;
  var pushState = history.pushState;
  history.pushState = function () {
    navigatedAt = Date.now();
    return pushState.apply(this, arguments);
  };
  window.addEventListener('popstate', function () { navigatedAt = Date.now(); });
  function sessionLapsed() {
    var cookie = document.cookie.match(/(?:^|; )_ga_${GA_MEASUREMENT_ID.slice(2)}=([^;]*)/);
    var lastHit = cookie && cookie[1].match(/\\$t(\\d+)/);
    if (!lastHit) return false;
    var lastHitAt = Math.max(Number(lastHit[1]) * 1000, lastQueued);
    var navigatedSince = Math.floor(navigatedAt / 1000) * 1000 > lastHitAt;
    return !navigatedSince && Date.now() - lastHitAt > ${GA_SESSION_TIMEOUT_SECONDS * 1000};
  }
  function withoutTypedText(address) {
    return withoutParams(address, isTypedText);
  }
  function sendPageView(view) {
    if (document.title) view.page_title = document.title;
    window.gtag('event', 'page_view', view);
  }
  function resumedPageView() {
    sendPageView({
      page_location: withoutParams(location.href, function (pair) { return isTypedText(pair) || isCampaignTag(pair); }),
      page_referrer: '',
    });
  }
  window.gtag = function () {
    if (arguments[0] === 'event') {
      if (arguments[1] !== 'page_view' && sessionLapsed()) resumedPageView();
      lastQueued = Date.now();
    }
    window.dataLayer.push(arguments);
  };
  gtag('js', new Date());
  gtag('config', '${GA_MEASUREMENT_ID}', { send_page_view: false });
  sendPageView({ page_location: withoutTypedText(location.href), page_referrer: withoutTypedText(document.referrer) });
})();`;

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
