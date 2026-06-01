/** @type {import('jest').Config} */
module.exports = {
  preset: "jest-expo",
  setupFiles: ["<rootDir>/src/__tests__/setup/env.ts"],
  setupFilesAfterEnv: ['<rootDir>/src/__tests__/setup/msw-server.ts'],
  testMatch: ["**/__tests__/**/*.test.{ts,tsx}"],

  // Uses the jest-expo preset base pattern (already handles .pnpm) plus the
  // extra packages that need to be transpiled by Babel in this project.
  transformIgnorePatterns: [
    "/node_modules/(?!(.pnpm|react-native|@react-native(-community)?|@rn-primitives|expo(nent)?|@expo(nent)?|@expo-google-fonts|react-navigation|@react-navigation|nativewind|lucide-react-native|@shopify|@mswjs/interceptors|@bundled-es-modules|@open-draft/deferred-promise|rettime|until-async))",
    "/node_modules/react-native-reanimated/plugin/",
    "/node_modules/@react-native/babel-preset/",
  ],

  transform: {
    "^.+\\.mjs$": "babel-jest",
  },

  moduleNameMapper: {
    "^@/core/di/di-provider$": "<rootDir>/src/core/di/di-Provider.tsx",
    "^@/assets/(.*)$": "<rootDir>/assets/$1",
    "^@/(.*)$": "<rootDir>/src/$1",
    "^msw/node$": "<rootDir>/node_modules/msw/lib/node/index.js",
    "^msw$": "<rootDir>/node_modules/msw/lib/core/index.js",
  },

  collectCoverageFrom: [
    "src/features/**/presentation/context/**/*.{ts,tsx}",
    "src/features/**/data/datasources/**/*.{ts,tsx}",
    "src/core/di/**/*.{ts,tsx}",
    "src/core/storage/**/*.{ts,tsx}",
    "src/core/lib/**/*.{ts,tsx}",
    "!src/**/*.stories.{ts,tsx}",
    "!src/mocks/**",
  ],

  // Threshold covers: context files + datasource implementations + core utilities.
  // Datasource impls have many HTTP methods; integration tests cover the critical paths.
  coverageThreshold: {
    global: {
      statements: 40,
      branches: 30,
      functions: 40,
      lines: 40,
    },
  },
};
