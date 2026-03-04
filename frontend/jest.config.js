/* eslint-disable @typescript-eslint/no-require-imports */
const nextJest = require('next/jest');

const createJestConfig = nextJest({
  dir: './',
});

/** @type {import('jest').Config} */
const customJestConfig = {
  testEnvironment: 'jest-environment-jsdom',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  testMatch: ['**/*.test.ts', '**/*.test.tsx'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
    '^@api/(.*)$': '<rootDir>/../shared/gen/$1',
  },
  collectCoverageFrom: [
    'features/**/*.tsx',
    'hooks/**/*.ts',
    'lib/**/*.ts',
    '!**/*.d.ts',
    '!**/index.ts',
  ],
};

module.exports = createJestConfig(customJestConfig);
