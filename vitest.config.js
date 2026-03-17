import {defineConfig} from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'jsdom',
    globals: false,
    include: ['test/**/*.test.js', 'test/index.js'],
    environmentMatchGlobs: [['test/ssr.test.js', 'node']],
    coverage: {
      include: ['src/**/*.js']
    }
  },
  define: {
    __DEV__: true
  }
});
