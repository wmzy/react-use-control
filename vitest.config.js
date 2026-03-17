import {defineConfig} from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'jsdom',
    globals: false,
    include: ['test/**/*.test.js', 'test/**/index.js'],
    exclude: ['test/.eslintrc.js', 'test/type.ts']
  },
  define: {
    __DEV__: true
  }
});
