import type {StorybookConfig} from '@storybook/react-vite';

const config: StorybookConfig = {
  stories: [
    '../stories/**/*.stories.mdx',
    '../stories/**/*.stories.@(js|jsx|ts|tsx)'
  ],
  addons: ['@storybook/addon-storysource', '@storybook/addon-essentials'],
  framework: {
    name: '@storybook/react-vite',
    options: {}
  },
  viteFinal(config) {
    return {
      define: {
        ...config.define,
        __DEV__: true
      },
      ...config
    };
  },
  docs: {
    autodocs: true
  }
};

export default config;
