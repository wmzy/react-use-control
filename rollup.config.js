import babel from '@rollup/plugin-babel';
import terser from '@rollup/plugin-terser';
import replace from '@rollup/plugin-replace';
import pkg from './package.json';

const banner = `
/*!
  * ${pkg.name} v${pkg.version} (${pkg.homepage})
  * Copyright (c) 2019-present ${pkg.author}
  * Licensed under ${pkg.license} (${pkg.homepage}/blob/master/LICENSE)
  */
`;

export default ['production', 'development'].map((env) => ({
  input: 'src/index.js',
  external: ['react'],
  plugins: [
    babel({
      exclude: ['node_modules/**']
    }),
    replace({
      __DEV__: env !== 'production'
    })
  ],
  output: [
    // browser-friendly UMD build
    env === 'production'
      ? {
          globals: {
            react: 'React'
          },
          name: pkg.name,
          banner,
          file: 'dist/umd/production.min.js',
          sourcemap: true,
          format: 'umd',
          plugins: [terser({output: {comments: /^!/}})]
        }
      : {
          globals: {
            react: 'React'
          },
          name: pkg.name,
          file: `dist/umd/${env}.js`,
          sourcemap: true,
          format: 'umd'
        },
    {
      file: `dist/${env}.js`,
      sourcemap: true,
      format: 'es'
    }
  ]
}));
