/** @type {import('jest').Config} */
module.exports = {
  preset: "jest-expo",
  setupFiles: ["<rootDir>/src/__tests__/setup/env.ts"],
  testMatch: ["**/__tests__/**/*.test.{ts,tsx}"],

  // Uses the jest-expo preset base pattern (already handles .pnpm) plus the
  // extra packages that need to be transpiled by Babel in this project.
  transformIgnorePatterns: [
    "/node_modules/(?!(.pnpm|react-native|@react-native(-community)?|@rn-primitives|expo(nent)?|@expo(nent)?|@expo-google-fonts|react-navigation|@react-navigation|nativewind|lucide-react-native|@shopify))",
    "/node_modules/react-native-reanimated/plugin/",
    "/node_modules/@react-native/babel-preset/",
  ],

  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/src/$1",
  },

  collectCoverageFrom: [
    "src/**/*.{ts,tsx}",
    "!src/**/*.stories.{ts,tsx}",
    "!src/mocks/**",
    "!src/app/**",
  ],
};
