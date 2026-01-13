/** @type {import('jest').Config} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  testMatch: [
    '**/__tests__/**/*.test.(ts|tsx|js|jsx)',
    '**/__tests__/**/*.property.test.(ts|tsx)'
  ],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    // Mock uuid module
    '^uuid$': '<rootDir>/src/lib/__tests__/__mocks__/uuid.js'
  },
  testTimeout: 60000,
  // Disable coverage collection for now to avoid JSX parsing issues
  collectCoverage: false,
  clearMocks: true,
  // Setup files for IndexedDB mock
  setupFiles: [
    '<rootDir>/src/lib/__tests__/setup-indexeddb.js'
  ]
};
