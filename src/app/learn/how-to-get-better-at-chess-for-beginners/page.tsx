import type { Metadata } from 'next';
import LearnArticle from '@/components/learn/LearnArticle';
import { buildLearnPageMetadata } from '@/lib/seo/learnMetadata';
import { getLearnPageBySlug } from '@/lib/seo/learnPages';

const slug = 'how-to-get-better-at-chess-for-beginners';
const page = getLearnPageBySlug(slug);

export const metadata: Metadata = buildLearnPageMetadata(slug);

export default function HowToGetBetterAtChessForBeginnersPage() {
  return <LearnArticle page={page} />;
}
