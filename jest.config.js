module.exports = {
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: 'src',
  testRegex: '.*\\.spec\\.ts$',
  transform: {
    '^.+\\.(t|j)s$': 'ts-jest',
  },
  collectCoverageFrom: ['**/*.(t|j)s'],
  coverageDirectory: '../coverage',
  testEnvironment: 'node',
  moduleNameMapper: {
    '^src/(.*)$': '<rootDir>/$1',
    '^@modules/(.*)$': '<rootDir>/modules/$1',
    '^@configs/(.*)$': '<rootDir>/configs/$1',
    '^@utils/(.*)$': '<rootDir>/utils/$1',
    '^@common/(.*)$': '<rootDir>/common/$1',
    '^@decorators/(.*)$': '<rootDir>/common/decorators/$1',
    '^@middlewares/(.*)$': '<rootDir>/common/middlewares/$1',
    '^@interceptors/(.*)$': '<rootDir>/common/interceptors/$1',
    '^@filters/(.*)$': '<rootDir>/common/filters/$1',
  },
  coverageThreshold: {
    global: {
      branches: 90,
      functions: 90,
      lines: 90,
      statements: 90,
    },
  },
  coverageReporters: ['json', 'lcov', 'text', 'clover'],
  coveragePathIgnorePatterns: [
    '.*\\.dto\\.ts$',
    '.*\\.config\\.ts$',
    '.*\\.types\\.ts$',
    '.*\\.enum\\.ts$',
    '.*\\.module\\.ts$',
    '.*\\.entity\\.ts$',
    '.*\\.interface\\.ts$',
    '.*constants\\.ts$',
    'main.ts',
    '<rootDir>/configs/',
    '<rootDir>/common/adapters/',
    '<rootDir>/common/interceptors/',
    '<rootDir>/common/filters/',
    '<rootDir>/common/decorators/',
  ],
};
