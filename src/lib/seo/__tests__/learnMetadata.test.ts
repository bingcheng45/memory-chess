import { buildLearnPageMetadata } from '@/lib/seo/learnMetadata';

describe('buildLearnPageMetadata', () => {
  it('builds metadata for the beginner roadmap', () => {
    const metadata = buildLearnPageMetadata('how-to-get-better-at-chess-for-beginners');

    expect(metadata.title).toBe('How to Get Better at Chess for Beginners');
    expect(metadata.description).toContain('beginner chess plan');
    expect(metadata.alternates?.canonical).toBe('/learn/how-to-get-better-at-chess-for-beginners');
    expect(metadata.openGraph?.type).toBe('article');
  });

  it('adds article timestamps and image metadata', () => {
    const metadata = buildLearnPageMetadata('how-to-stop-blundering-in-chess');

    expect(metadata.openGraph?.publishedTime).toBe('2026-03-06T00:00:00.000Z');
    expect(metadata.openGraph?.modifiedTime).toBe('2026-03-23T00:00:00.000Z');
    expect(metadata.openGraph?.images?.[0]).toMatchObject({
      url: 'https://thememorychess.com/learn/how-to-stop-blundering-in-chess/opengraph-image',
    });
    expect(metadata.authors?.[0]).toMatchObject({ name: 'Memory Chess Editorial Team' });
  });
});
