import { BrainLabHome } from "@/components/home/BrainLabHome";
import { LegacyHome } from "@/components/home/LegacyHome";
import { hasLabCopy } from "@/lib/home/labLocales";

type HomeProps = {
  params: Promise<{ locale: string }>;
};

export default async function Home({ params }: HomeProps) {
  const { locale } = await params;
  return hasLabCopy(locale) ? <BrainLabHome /> : <LegacyHome />;
}
