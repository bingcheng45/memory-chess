import { getFeaturedLearnPages, getLearnPageBySlug, LEARN_PAGES } from '@/lib/seo/learnPages';

describe('learnPages registry', () => {
  it('returns unique slugs including the new cluster pages', () => {
    const slugs = LEARN_PAGES.map((page) => page.slug);

    expect(slugs).toContain('how-to-stop-blundering-in-chess');
    expect(slugs).toContain('why-puzzle-rating-doesnt-transfer-to-games');
    expect(slugs).toContain('20-minute-daily-chess-study-plan');
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it('returns the refreshed beginner roadmap with richer content fields', () => {
    const page = getLearnPageBySlug('how-to-get-better-at-chess-for-beginners');

    expect(page.quickAnswer).toContain('repeatable');
    expect(page.contentSections.length).toBeGreaterThanOrEqual(5);
    expect(page.relatedArticles.length).toBeGreaterThanOrEqual(3);
    expect(page.relatedDrills.length).toBeGreaterThanOrEqual(2);
  });

  it('returns featured hub pages', () => {
    const pages = getFeaturedLearnPages();

    expect(pages.length).toBeGreaterThan(0);
    expect(pages.every((page) => page.featured)).toBe(true);
  });
});
