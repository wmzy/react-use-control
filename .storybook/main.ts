import type {StorybookConfig} from '@storybook/react-vite';

const config: StorybookConfig = {
  stories: [
    '../stories/**/*.mdx',
    '../stories/**/*.stories.@(js|jsx|ts|tsx)'
  ],

  addons: ['@storybook/addon-docs'],

  framework: {
    name: '@storybook/react-vite',
    options: {}
  },

  typescript: {
    reactDocgen: false,
  },

  viteFinal(config) {
    return {
      ...config,
      define: {
        ...config.define,
        __DEV__: true
      }
    };
  }
};

export default config;
