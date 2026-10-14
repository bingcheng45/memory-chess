import { progressPreview, resultPreview } from "@/lib/share/cardCopy";
import { progressImage, resultImage } from "@/lib/share/previewImage";
import { parseProgress, parseResult } from "@/lib/share/shareCode";

type Params = { params: Promise<{ kind: string; code: string }> };

/** A shared card as its link preview, drawn from the figures in its URL. */
export async function GET(_request: Request, { params }: Params): Promise<Response> {
  const { kind, code } = await params;
  if (kind === "progress") {
    const progress = parseProgress(code);
    if (progress) return progressImage(progressPreview(progress));
  }
  if (kind === "result") {
    const share = parseResult(code);
    if (share) return resultImage(resultPreview(share), share.kind === "daily" ? null : share.board);
  }
  return new Response("Not found", { status: 404, headers: { "Cache-Control": "public, max-age=3600" } });
}
