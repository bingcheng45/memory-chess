const FAILED = new Set(["failure", "error"]);
const MINUTE = 60_000;

export async function waitForDeployment({ api, sha, now, sleep, log, pollMs, noDeploymentMs, timeoutMs }) {
  const short = sha.slice(0, 12);
  const start = now();
  for (;;) {
    const elapsed = now() - start;
    let newest = [];
    try {
      const deployments = await api(`/deployments?sha=${sha}&environment=Production`);
      newest = await Promise.all(deployments.map(async ({ id }) => (await api(`/deployments/${id}/statuses`)).map((s) => s.state)));
    } catch (cause) {
      log(cause.message);
    }
    if (newest.some((states) => states.includes("success"))) return { deployed: true };
    if (newest.length > 0 && newest.every(([latest]) => FAILED.has(latest))) {
      return { deployed: false, reason: `the Production deployment of ${short} ended with ${newest[0][0]}` };
    }
    if (newest.length === 0 && elapsed >= noDeploymentMs) {
      return { deployed: false, reason: `no Production deployment of ${short} appeared within ${noDeploymentMs / MINUTE} minutes` };
    }
    if (elapsed >= timeoutMs) {
      return { deployed: false, reason: `the Production deployment of ${short} did not finish within ${timeoutMs / MINUTE} minutes` };
    }
    await sleep(pollMs);
  }
}
