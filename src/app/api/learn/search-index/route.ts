import { NextResponse } from "next/server";
import { learnSearchDocs } from "@/lib/seo/learn/searchDocs";

export const dynamic = "force-static";

/** The hub's search fetches this on first focus, so a reader who never searches downloads none of it. */
export function GET() {
  return NextResponse.json(learnSearchDocs({ withBody: false }));
}
