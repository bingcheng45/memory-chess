import type { Metadata } from 'next';
import LearnArticle from '@/components/learn/LearnArticle';
import { buildLearnPageMetadata } from '@/lib/seo/learnMetadata';
import { getLearnPageBySlug } from '@/lib/seo/learnPages';

const slug = 'chess-board-vision-drills';
const page = getLearnPageBySlug(slug);

export const metadata: Metadata = buildLearnPageMetadata(slug);

export default function ChessBoardVisionDrillsPage() {
  return <LearnArticle page={page} />;
}
