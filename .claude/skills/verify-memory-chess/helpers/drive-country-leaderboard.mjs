const GLOBE = String.fromCodePoint(0x1f30d);
const SINGAPORE = String.fromCodePoint(0x1f1f8, 0x1f1ec);
const GERMANY = String.fromCodePoint(0x1f1e9, 0x1f1ea);

export default async function drive(page, { baseUrl }) {
  await page.goto(`${baseUrl}/leaderboard`);
  await page.waitFor(`!document.body.innerText.includes("Loading leaderboard")`);
  await page.waitFor(`document.querySelectorAll("tbody tr").length > 0`);

  const rows = await page.eval(
    `[...document.querySelectorAll("tbody tr")].map(tr => {
       const flag = tr.querySelector('[role="img"]');
       return {
         player: tr
           .querySelector("td:nth-child(2)")
           .textContent.replace(flag ? flag.textContent : "", "")
           .trim(),
         flag: flag ? flag.textContent.trim() : null,
         name: flag ? flag.getAttribute("aria-label") : null,
         title: flag ? flag.getAttribute("title") : null,
       };
     })`,
  );

  const find = (player) => {
    const row = rows.find((r) => r.player === player);
    if (!row) throw new Error(`no leaderboard row for ${player}; saw ${JSON.stringify(rows)}`);
    return row;
  };

  const expectations = [
    { player: "Merlion", flag: SINGAPORE, name: "Singapore" },
    { player: "Blitzkind", flag: GERMANY, name: "Germany" },
    { player: "Nomad", flag: GLOBE, name: "World" },
    { player: "Before Migration", flag: GLOBE, name: "World" },
  ];

  for (const { player, flag, name } of expectations) {
    const row = find(player);
    if (row.flag !== flag || row.name !== name || row.title !== name) {
      throw new Error(`row ${player} rendered ${JSON.stringify(row)}, expected ${flag} / ${name}`);
    }
  }

  await page.screenshot("1-leaderboard-flags.png");

  await page.send("Emulation.setDeviceMetricsOverride", {
    width: 375,
    height: 812,
    deviceScaleFactor: 1,
    mobile: true,
  });
  await page.sleep(300);
  await page.screenshot("2-leaderboard-flags-375.png");

  // The flag widens the player column, so the narrow table has to stay
  // scrollable all the way to the date rather than clip it.
  const narrow = await page.eval(
    `(() => {
       const table = document.querySelector("tbody").closest("table");
       const scroller = table.parentElement;
       const dateCell = document.querySelector("tbody tr td:last-child");
       scroller.scrollLeft = scroller.scrollWidth;
       const cell = dateCell.getBoundingClientRect();
       const box = scroller.getBoundingClientRect();
       return {
         scrollWidth: Math.round(scroller.scrollWidth),
         clientWidth: Math.round(scroller.clientWidth),
         overflowX: getComputedStyle(scroller).overflowX,
         dateReachable: cell.left >= box.left - 1 && cell.right <= box.right + 1,
         dateText: dateCell.textContent.trim(),
         documentScrollsSideways: document.documentElement.scrollWidth > window.innerWidth,
       };
     })()`,
  );
  if (!narrow.dateReachable) {
    throw new Error(`the date column is unreachable at 375px: ${JSON.stringify(narrow)}`);
  }
  if (narrow.documentScrollsSideways) {
    throw new Error(`the page itself scrolls sideways at 375px: ${JSON.stringify(narrow)}`);
  }
  await page.screenshot("3-leaderboard-scrolled-375.png");
  await page.send("Emulation.clearDeviceMetricsOverride");

  return { rowCount: rows.length, rows, narrow };
}
