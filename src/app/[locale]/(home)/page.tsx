import { BrainLabHome, LegacyHome } from "@/components/home/HomeBodies";
import { hasLabCopy } from "@/lib/home/labLocales";

type HomeProps = {
  params: Promise<{ locale: string }>;
};

export default async function Home({ params }: HomeProps) {
  const { locale } = await params;
  return hasLabCopy(locale) ? <BrainLabHome /> : <LegacyHome />;
}
