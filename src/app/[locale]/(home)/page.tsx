import { BrainLabHome } from "@/components/home/BrainLabHome";
import { LegacyHome } from "@/components/home/LegacyHome";
import { hasLabCopy } from "@/lib/home/labLocales";

type HomeProps = {
  params: Promise<{ locale: string }>;
};

// Branching on the server sends each locale only the body it renders.
export default async function Home({ params }: HomeProps) {
  const { locale } = await params;
  return hasLabCopy(locale) ? <BrainLabHome /> : <LegacyHome />;
}
