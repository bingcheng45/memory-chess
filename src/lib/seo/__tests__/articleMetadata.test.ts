import { ARTICLE_LIST_COPY } from "@/lib/articles/copy";
import { makeArticle, summaryOf } from "@/lib/articles/__tests__/fixtures";
import { buildArticleListMetadata, buildArticleMetadata } from "@/lib/seo/articleMetadata";
import { LEARN_AUTHOR } from "@/lib/seo/learn/schema";

const SITE = "https://thememorychess.com";

describe("buildArticleMetadata", () => {
  const article = makeArticle(0, { updatedAt: "2026-03-05T00:00:00.000Z" });
  const metadata = buildArticleMetadata(article);
  const portrait = {
    url: `${SITE}${article.photo.src}`,
    width: article.photo.width,
    height: article.photo.height,
    alt: article.photo.alt,
  };

  it("uses the article's own title and description", () => {
    expect(metadata.title).toBe(article.title);
    expect(metadata.description).toBe(article.description);
  });

  it("has a bare self canonical and no language alternates", () => {
    expect(metadata.alternates).toEqual({ canonical: `/articles/${article.slug}` });
  });

  it("shares as an article with the portrait as its image", () => {
    expect(metadata.openGraph).toMatchObject({
      type: "article",
      url: `${SITE}/articles/${article.slug}`,
      title: article.title,
      description: article.description,
      publishedTime: article.publishedAt,
      modifiedTime: article.updatedAt,
      authors: [LEARN_AUTHOR.name],
      images: [portrait],
    });
    expect(metadata.twitter).toMatchObject({
      card: "summary",
      title: article.title,
      description: article.description,
      images: [portrait.url],
    });
  });

  it("names the author", () => {
    expect(metadata.authors).toEqual([{ name: LEARN_AUTHOR.name, url: LEARN_AUTHOR.url }]);
  });
});

describe("buildArticleListMetadata", () => {
  const newest = summaryOf(makeArticle(0));
  const metadata = buildArticleListMetadata(newest);

  it("uses the list copy with a bare self canonical and no language alternates", () => {
    expect(metadata.title).toBe(ARTICLE_LIST_COPY.meta.title);
    expect(metadata.description).toBe(ARTICLE_LIST_COPY.meta.description);
    expect(metadata.alternates).toEqual({ canonical: "/articles" });
  });

  it("shares with the newest article's portrait", () => {
    expect(metadata.openGraph).toMatchObject({
      type: "website",
      url: `${SITE}/articles`,
      title: ARTICLE_LIST_COPY.meta.title,
      description: ARTICLE_LIST_COPY.meta.description,
      images: [
        {
          url: `${SITE}${newest.photo.src}`,
          width: newest.photo.width,
          height: newest.photo.height,
          alt: newest.photo.alt,
        },
      ],
    });
    expect(metadata.twitter).toMatchObject({ card: "summary", images: [`${SITE}${newest.photo.src}`] });
  });
});

describe("the list page's meta copy", () => {
  it("fits a search result", () => {
    expect(ARTICLE_LIST_COPY.meta.title.length).toBeLessThanOrEqual(60);
    expect(ARTICLE_LIST_COPY.meta.description.length).toBeGreaterThanOrEqual(120);
    expect(ARTICLE_LIST_COPY.meta.description.length).toBeLessThanOrEqual(155);
  });
});
