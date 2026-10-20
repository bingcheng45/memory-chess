const NOT_LIVE = { inactive: "was canceled", failure: "ended with failure", error: "ended with error" };
const MINUTE = 60_000;

export async function waitForDeployment({ api, sha, now, sleep, log, pollMs, timeoutMs }) {
  const short = sha.slice(0, 12);
  const start = now();
  for (;;) {
    let deployments = [];
    try {
      const listed = await api(`/deployments?sha=${sha}&environment=Production`);
      deployments = await Promise.all(listed.map(async ({ id }) => (await api(`/deployments/${id}/statuses`)).map((s) => s.state)));
    } catch (cause) {
      log(cause.message);
    }
    if (deployments.some((states) => states.includes("success"))) return { deployed: true };
    if (deployments.length > 0 && deployments.every(([latest]) => latest in NOT_LIVE)) {
      return { deployed: false, reason: `the Production deployment of ${short} ${NOT_LIVE[deployments[0][0]]}` };
    }
    if (now() - start >= timeoutMs) {
      return { deployed: false, reason: `no successful Production deployment of ${short} within ${timeoutMs / MINUTE} minutes` };
    }
    await sleep(pollMs);
  }
}
