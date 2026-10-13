import { BrainLabHome } from "@/components/home/BrainLabHome";
import { RECORD_HINT } from "@/components/home/recordHint";

export default function Home() {
  return (
    <>
      {/* Runs while the page is parsed, before §06 paints; it marks itself, which React does not render. */}
      <script suppressHydrationWarning dangerouslySetInnerHTML={{ __html: RECORD_HINT }} />
      <BrainLabHome />
    </>
  );
}
