/** @jest-environment node */

import { NextRequest } from "next/server";
import { GET } from "@/app/api/geo/route";

const get = (headers: Record<string, string>) => GET(new NextRequest("http://localhost/api/geo", { headers }));

describe("GET /api/geo", () => {
  it("answers the two-letter country Vercel's edge read from the connection, kept out of every cache", async () => {
    const response = await get({ "x-vercel-ip-country": "SG" });

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ country: "SG" });
    expect(response.headers.get("Cache-Control")).toBe("private, no-store");
  });

  it.each([
    ["no header", {}],
    ["an unknown code", { "x-vercel-ip-country": "XX" }],
    ["the world code", { "x-vercel-ip-country": "ZZ" }],
    ["a lower-case code", { "x-vercel-ip-country": "sg" }],
  ])("answers no country for %s", async (_case, headers) => {
    expect(await (await get(headers)).json()).toEqual({ country: null });
  });
});
