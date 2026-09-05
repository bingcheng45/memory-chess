const nextJest = require('next/jest');

const createJestConfig = nextJest({
  // Provide the path to your Next.js app to load next.config.js and .env files in your test environment
  dir: './',
});

// Add any custom config to be passed to Jest
const customJestConfig = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testEnvironment: 'jest-environment-jsdom',
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  testMatch: ['**/__tests__/**/*.test.[jt]s?(x)'],
  // Agent worktrees under .claude/ carry a full copy of the repo, so without
  // this every suite runs twice and a broken worktree fails the real run.
  testPathIgnorePatterns: ['/node_modules/', '/.claude/'],
};

/**
 * next/jest *prepends* its own `/node_modules/(?!.pnpm)(?!()/)` entry, and
 * transformIgnorePatterns is an OR -- so any pattern matching a file wins and
 * appending our own does nothing. next-intl and use-intl are ESM-only, so they
 * have to be transformed or every suite importing @/i18n/navigation dies on
 * `Unexpected token 'export'`. Replacing the array after the fact is the only
 * way to win, and keeps this a test-config concern rather than forcing
 * `transpilePackages` into the production build.
 */
module.exports = async () => {
  const config = await createJestConfig(customJestConfig)();

  // next-intl pulls in the @formatjs / intl-messageformat family, which is
  // ESM-only too, so the whole transitive chain has to be transformed.
  const esmPackages = [
    'next-intl',
    'use-intl',
    'intl-messageformat',
    '@formatjs/[^/]+',
  ].join('|');

  config.transformIgnorePatterns = [
    `/node_modules/(?!(${esmPackages})/)`,
    '^.+\\.module\\.(css|sass|scss)$',
  ];

  return config;
};
