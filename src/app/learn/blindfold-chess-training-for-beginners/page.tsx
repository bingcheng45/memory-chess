import type { Metadata } from 'next';
import LearnArticle from '@/components/learn/LearnArticle';
import { buildLearnPageMetadata } from '@/lib/seo/learnMetadata';
import { getLearnPageBySlug } from '@/lib/seo/learnPages';

const slug = 'blindfold-chess-training-for-beginners';
const page = getLearnPageBySlug(slug);

export const metadata: Metadata = buildLearnPageMetadata(slug);

export default function BlindfoldChessTrainingForBeginnersPage() {
  return <LearnArticle page={page} />;
}
