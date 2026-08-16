# Memory Chess AdSense Layout Plan

Status: **Planned. No ad units are active.**

The AdSense ownership script and `ads.txt` file are live for site review. Actual
ad units must not be added or enabled until `thememorychess.com` shows **Ready**
in AdSense.

## Design goals

- Keep the board, timer, controls, and result actions easy to use.
- Start with one ad per eligible page.
- Keep ads clearly separate from game controls and label manual placements
  `Advertisement`.
- Use responsive display units so the layout works on phones and desktops.
- Prefer manual placements at launch. Leave Auto ads, anchors, vignettes,
  pop-ups, and interstitials off while we measure the first rollout.

## Initial placements

### Game result page

- Show one responsive display ad only after a completed game reaches the result
  screen.
- Place it below the full result card, feedback experience, leaderboard form,
  and Play Again controls.
- Keep at least 150 pixels between the game/control area and the ad container to
  reduce accidental taps and clicks.
- Never show an ad during configuration, memorization, or position recreation.

### Learning articles

- Show one responsive in-content ad after the first complete teaching section
  on long Learning Center articles.
- Add generous vertical spacing and a visible `Advertisement` label.
- Do not insert an ad inside a checklist, exercise, comparison table, or call to
  action.

## Routes without ads at launch

- Home
- Leaderboard
- Changelog
- Contact Us
- Privacy Policy
- Settings
- Learning Center index

This keeps important navigation and trust pages clean and gives us a simple
baseline before considering any expansion.

## Approval gate

After AdSense changes the site status to **Ready**:

1. Create separate responsive display ad units for `Game result` and
   `Learning article` in AdSense.
2. Add the two slot IDs to Vercel as environment variables. Do not commit slot
   IDs as activation switches.
3. Add a shared ad component that renders only when
   `NEXT_PUBLIC_ADSENSE_ENABLED` is exactly `true` and the matching slot ID is
   present.
4. Enable the flag only in production after privacy, consent, desktop, and
   mobile checks pass.
5. Confirm no ad appears during active gameplay and that the result-page unit
   remains at least 150 pixels from controls at every breakpoint.

## First-week checks

- Watch AdSense Policy Center and invalid-traffic warnings daily.
- Check layout shift, mobile overflow, and page speed.
- Compare result-page completion and Play Again usage before and after launch.
- Remove or move a placement if it distracts players, causes accidental clicks,
  or makes content harder to reach.

## Policy references

- [Ad placement policies](https://support.google.com/adsense/answer/1346295)
- [Ads on gameplay pages](https://support.google.com/adsense/answer/2768340)
- [Best practices for ad placement](https://support.google.com/adsense/answer/1282097)
