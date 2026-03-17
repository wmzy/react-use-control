import js from '@eslint/js';
import prettier from 'eslint-plugin-prettier/recommended';
import globals from 'globals';

export default [
  js.configs.recommended,
  prettier,
  {
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        ...globals.browser,
        ...globals.node,
        __DEV__: 'readonly'
      }
    },
    rules: {
      'no-return-assign': ['error', 'except-parens'],
      'no-shadow': 'off',
      'no-param-reassign': 'off',
      'no-use-before-define': ['error', {functions: false}],
      'no-console': process.env.NODE_ENV === 'production' ? 'error' : 'warn',
      'no-debugger': process.env.NODE_ENV === 'production' ? 'error' : 'off'
    }
  },
  {
    files: ['test/**/*.js'],
    rules: {
      'no-unused-vars': 'off'
    }
  },
  {
    ignores: ['dist/**', 'storybook-static/**', 'node_modules/**']
  }
];
