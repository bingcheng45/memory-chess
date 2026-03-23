'use client';

import { useEffect, useRef } from 'react';
import { analyticsTracker } from '@/lib/utils/analyticsTracker';
import type { LearnPageContent } from '@/lib/seo/learnPages';

type LearnArticleTrackingProps = {
  page: LearnPageContent;
};

export default function LearnArticleTracking({ page }: LearnArticleTrackingProps) {
  const hasTrackedScrollDepth = useRef(false);

  useEffect(() => {
    analyticsTracker.trackFeatureUsage('learn_article', 'view', {
      slug: page.slug,
      goal: page.goal,
      keyword: page.primaryKeyword,
    });

    const onScroll = () => {
      if (hasTrackedScrollDepth.current) {
        return;
      }

      const scrollableHeight = document.documentElement.scrollHeight - window.innerHeight;
      if (scrollableHeight <= 0) {
        return;
      }

      const progress = window.scrollY / scrollableHeight;

      if (progress >= 0.5) {
        hasTrackedScrollDepth.current = true;
        analyticsTracker.trackFeatureUsage('learn_article', 'scroll_50', {
          slug: page.slug,
        });
      }
    };

    const onClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null;
      const cta = target?.closest<HTMLElement>('[data-learn-cta]');
      const internalLink = target?.closest<HTMLElement>('[data-learn-link]');

      if (cta) {
        analyticsTracker.trackRecommendationClick(`learn_cta:${cta.dataset.learnCta ?? 'unknown'}`);
      }

      if (internalLink) {
        analyticsTracker.trackFeatureUsage('learn_article', 'internal_link_click', {
          slug: page.slug,
          target: internalLink.dataset.learnLink,
        });
      }
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    document.addEventListener('click', onClick);

    return () => {
      window.removeEventListener('scroll', onScroll);
      document.removeEventListener('click', onClick);
    };
  }, [page.goal, page.primaryKeyword, page.slug]);

  return null;
}
