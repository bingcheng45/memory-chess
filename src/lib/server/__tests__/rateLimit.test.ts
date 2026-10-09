/** @jest-environment node */

import { clientAddress, fixedWindowLimiter } from "@/lib/server/rateLimit";

describe("fixedWindowLimiter", () => {
  it("allows the limit in a window, refuses the next with the seconds left, and allows again once it ends", () => {
    const allow = fixedWindowLimiter({ limit: 2, windowMs: 60_000, maxKeys: 10 });

    expect([allow("a", 0), allow("a", 1_000), allow("a", 20_500), allow("b", 20_500), allow("a", 60_000)]).toEqual([
      { allowed: true },
      { allowed: true },
      { allowed: false, retryAfterSeconds: 40 },
      { allowed: true },
      { allowed: true },
    ]);
  });

  it("forgets the oldest caller rather than growing past its key limit", () => {
    const allow = fixedWindowLimiter({ limit: 1, windowMs: 60_000, maxKeys: 2 });
    allow("a", 0);
    allow("b", 0);
    allow("c", 0);

    expect([allow("a", 1), allow("c", 1)]).toEqual([{ allowed: true }, { allowed: false, retryAfterSeconds: 60 }]);
  });

  it("forgets an address at the first check after its window ends, even when that address never returns", () => {
    const allow = fixedWindowLimiter({ limit: 1, windowMs: 60_000, maxKeys: 10 });
    allow("a", 0);
    allow("b", 30_000);
    const kept = [allow.size()];

    allow("c", 60_000);
    kept.push(allow.size());
    allow("c", 90_000);
    kept.push(allow.size());

    expect(kept).toEqual([2, 2, 1]);
  });
});

describe("clientAddress", () => {
  it("takes the first forwarded address, then the real ip header, then one shared bucket", () => {
    expect(
      [
        new Headers({ "x-forwarded-for": "203.0.113.7, 10.0.0.1" }),
        new Headers({ "x-real-ip": "198.51.100.2" }),
        new Headers(),
      ].map(clientAddress),
    ).toEqual(["203.0.113.7", "198.51.100.2", "unknown"]);
  });
});
