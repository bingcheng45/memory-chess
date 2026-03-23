import type { ComponentProps } from 'react';
import { render, screen } from '@testing-library/react';
import LearnArticleRich from '@/components/learn/LearnArticleRich';
import { getLearnPageBySlug } from '@/lib/seo/learnPages';

jest.mock('next/link', () => {
  function MockNextLink({ children, href, ...props }: ComponentProps<'a'>) {
    return (
      <a href={typeof href === 'string' ? href : '#'} {...props}>
        {children}
      </a>
    );
  }

  return MockNextLink;
});

jest.mock('next/image', () => ({
  __esModule: true,
  default: function MockImage(props: ComponentProps<'img'>) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img alt={props.alt} src={typeof props.src === 'string' ? props.src : ''} />;
  },
}));

jest.mock('@/components/ui/PageHeader', () => {
  function MockPageHeader() {
    return <div>PageHeader</div>;
  }

  MockPageHeader.displayName = 'MockPageHeader';

  return MockPageHeader;
});

jest.mock('@/components/ui/Footer', () => {
  function MockFooter() {
    return <div>Footer</div>;
  }

  MockFooter.displayName = 'MockFooter';

  return MockFooter;
});

jest.mock('@/components/learn/LearnArticleTracking', () => {
  function MockLearnArticleTracking() {
    return null;
  }

  MockLearnArticleTracking.displayName = 'MockLearnArticleTracking';

  return MockLearnArticleTracking;
});
jest.mock('@/components/ui/button', () => ({
  Button: function MockButton({
    children,
    asChild,
    ...props
  }: ComponentProps<'button'> & { asChild?: boolean }) {
    if (asChild) {
      return <div {...props}>{children}</div>;
    }

    return (
      <button type="button" {...props}>
        {children}
      </button>
    );
  },
}));

describe('LearnArticleRich', () => {
  it('renders quick answer, drill ideas, and reference links for the beginner roadmap', () => {
    const page = getLearnPageBySlug('how-to-get-better-at-chess-for-beginners');

    render(<LearnArticleRich page={page} />);

    expect(screen.getByText('Start here')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Memory Chess drill ideas' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Reference links' })).toBeInTheDocument();
    expect(screen.getByText(/Beginners usually improve fastest/i)).toBeInTheDocument();
  });

  it('renders the related training paths section for cluster navigation', () => {
    const page = getLearnPageBySlug('how-to-stop-blundering-in-chess');

    render(<LearnArticleRich page={page} />);

    expect(screen.getByRole('heading', { name: 'Related training paths' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Read this guide/i })).toBeInTheDocument();
  });
});
