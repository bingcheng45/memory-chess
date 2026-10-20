import { BrainLabHome } from "@/components/home/BrainLabHome";
import { RECORD_HINT } from "@/components/home/recordHint";
import { getTotalPlays } from "@/lib/services/totalPlays";

export const revalidate = 3600;

export default async function Home() {
  const plays = await getTotalPlays();
  return (
    <>
      {/* Runs while the page is parsed, before §06 paints; it marks itself, which React does not render. */}
      <script suppressHydrationWarning dangerouslySetInnerHTML={{ __html: RECORD_HINT }} />
      <BrainLabHome initialPlays={plays?.plays} />
    </>
  );
}
