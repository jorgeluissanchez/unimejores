import type { StorybookConfig } from '@storybook/react-vite';
import path from 'path';
import { readFile } from 'fs/promises';

const nativeExclude = [
  '@rn-primitives/accordion', '@rn-primitives/alert-dialog', '@rn-primitives/aspect-ratio',
  '@rn-primitives/avatar', '@rn-primitives/checkbox', '@rn-primitives/collapsible',
  '@rn-primitives/context-menu', '@rn-primitives/dialog', '@rn-primitives/dropdown-menu',
  '@rn-primitives/hover-card', '@rn-primitives/label', '@rn-primitives/menubar',
  '@rn-primitives/popover', '@rn-primitives/portal', '@rn-primitives/progress',
  '@rn-primitives/radio-group', '@rn-primitives/select', '@rn-primitives/separator',
  '@rn-primitives/slot', '@rn-primitives/switch', '@rn-primitives/tabs',
  '@rn-primitives/toast', '@rn-primitives/toggle', '@rn-primitives/toggle-group',
  '@rn-primitives/tooltip',
  'react-native', 'react-native-css-interop', 'nativewind',
  'react-native-reanimated', 'react-native-screens', 'react-native-safe-area-context',
  'react-native-gesture-handler', 'react-native-svg', 'react-native-worklets',
  'expo', 'expo-clipboard', 'expo-constants', 'expo-device', 'expo-document-picker',
  'expo-file-system', 'expo-font', 'expo-glass-effect', 'expo-image', 'expo-linking',
  'expo-router', 'expo-sharing', 'expo-splash-screen', 'expo-status-bar', 'expo-symbols',
  'expo-system-ui', 'expo-web-browser',
  'lucide-react-native',
];

const isNativeModule = (id: string) =>
  /@rn-primitives/.test(id) ||
  /node_modules[\\/](expo[-/]|expo[^-/])/.test(id) ||
  /node_modules[\\/]react-native-css-interop/.test(id) ||
  /node_modules[\\/]nativewind/.test(id) ||
  /node_modules[\\/]lucide-react-native/.test(id);

const config: StorybookConfig = {
  stories: ['../src/**/*.stories.@(js|jsx|ts|tsx)'],
  addons: [
    '@storybook/addon-essentials',
    '@storybook/addon-interactions',
  ],
  framework: {
    name: '@storybook/react-vite',
    options: {},
  },
  async viteFinal(viteConfig) {
    viteConfig.resolve ??= {};

    const existingAlias = viteConfig.resolve.alias ?? {};
    const baseAlias = Array.isArray(existingAlias)
      ? existingAlias
      : Object.entries(existingAlias).map(([find, replacement]) => ({ find, replacement: replacement as string }));

    viteConfig.resolve.alias = [
      ...baseAlias,
      { find: /^react-native$/, replacement: 'react-native-web' },
      { find: /^react-native\/.*/, replacement: path.resolve(__dirname, './mocks/react-native-subpath.js') },
      { find: 'react-native-screens', replacement: path.resolve(__dirname, './mocks/react-native-screens.tsx') },
      { find: 'react-native-safe-area-context', replacement: path.resolve(__dirname, './mocks/react-native-safe-area-context.tsx') },
      { find: 'react-native-reanimated', replacement: path.resolve(__dirname, './mocks/react-native-reanimated.tsx') },
      { find: 'react-native-svg', replacement: path.resolve(__dirname, './mocks/react-native-subpath.js') },
      { find: '@', replacement: path.resolve(__dirname, '../src') },
    ];

    // Exclude ALL RN/Expo packages from rolldown pre-bundling (they have JSX in .js/.mjs)
    viteConfig.optimizeDeps ??= {};
    viteConfig.optimizeDeps.exclude = [
      ...(viteConfig.optimizeDeps.exclude ?? []),
      ...nativeExclude,
    ];

    // Load hook: transform JSX in RN/Expo .js/.mjs before OXC sees them at serve time
    viteConfig.plugins ??= [];
    (viteConfig.plugins as any[]).push({
      name: 'load-native-jsx',
      enforce: 'pre',
      async load(rawId: string) {
        const id = rawId.split('?')[0];
        if (!id.includes('node_modules')) return null;
        if (!isNativeModule(id)) return null;
        if (!/\.(mjs|js)$/.test(id)) return null;
        try {
          const code = await readFile(id, 'utf-8');
          if (!code.includes('<') && !code.includes('createElement')) return null;
          const esbuild = await import('esbuild');
          const result = await esbuild.transform(code, {
            loader: 'jsx',
            jsx: 'automatic',
            jsxImportSource: 'react',
          });
          return { code: result.code, map: result.map || null };
        } catch {
          return null;
        }
      },
    });

    return viteConfig;
  },
};

export default config;
