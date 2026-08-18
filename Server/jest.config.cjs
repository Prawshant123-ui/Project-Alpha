module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/tests'],
  testMatch: ['**/*.test.ts'],
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1',
  },
  transform: {
    '^.+\\.ts$': ['ts-jest', { tsconfig: 'tsconfig.test.json' }],
  },
  setupFilesAfterEnv: ['<rootDir>/tests/setup.ts'],
  clearMocks: true,
};