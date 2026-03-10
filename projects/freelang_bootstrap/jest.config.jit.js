// JIT test suite (runs in isolated process with more memory)
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  testMatch: ['**/jit.test.ts'],
  moduleFileExtensions: ['ts', 'js', 'json', 'node'],
  maxWorkers: 1,
  forceExit: true,
  detectOpenHandles: false,
  testTimeout: 300000, // 5분 타임아웃
  globals: {
    'ts-jest': {
      isolatedModules: true
    }
  }
};
