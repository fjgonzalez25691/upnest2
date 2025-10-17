

/** @type { import('@storybook/react-vite').StorybookConfig } */
const config = {
  stories: [
    {
      directory: "../src",
      files: "**/*.stories.@(js|jsx|mjs|ts|tsx)"
    }
  ],
  addons: [
    '@chromatic-com/storybook',
    '@storybook/addon-docs',
    '@storybook/addon-a11y',
    '@storybook/addon-themes',
    '@storybook/addon-vitest'
  ],

  framework: {
    name: '@storybook/react-vite',
    options: {}
  },
  "features": {
    "buildStoriesJson": true
  },
  "staticDirs": ["../public"]
};
export default config;
