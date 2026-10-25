import { BrainLabHome } from "@/components/home/BrainLabHome";
import { IntroShell } from "@/components/home/intro/IntroShell";
import { RECORD_HINT } from "@/components/home/recordHint";
import { getTotalPlays } from "@/lib/services/totalPlays";

const HOME_INTRO = process.env.NEXT_PUBLIC_HOME_INTRO === "1";

export default async function Home() {
  const plays = await getTotalPlays();
  return (
    <>
      {HOME_INTRO && <IntroShell />}
      {/* Runs while the page is parsed, before §06 paints; it marks itself, which React does not render. */}
      <script suppressHydrationWarning dangerouslySetInnerHTML={{ __html: RECORD_HINT }} />
      <BrainLabHome initialPlays={plays?.plays} />
    </>
  );
}
