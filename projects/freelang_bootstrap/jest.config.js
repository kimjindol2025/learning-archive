// Main test suite (excluding JIT tests which run in separate process)
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  testMatch: ['**/*.test.ts'],
  testPathIgnorePatterns: ['/src/jit.test.ts'],
  moduleFileExtensions: ['ts', 'js', 'json', 'node'],
  maxWorkers: 2,
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.test.ts',
    '!src/**/index.ts',
    '!src/**/types.ts'
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    }
  }
};
