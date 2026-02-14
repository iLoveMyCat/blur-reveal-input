import typescript from '@rollup/plugin-typescript';
import terser from '@rollup/plugin-terser';
import { dts } from 'rollup-plugin-dts';

const banner = `/**
 * Blur Reveal Input v1.0.0
 * Password input with blur effect that can be selectively revealed
 * https://github.com/iLoveMyCat/blur-reveal-input
 * @license MIT
 */`;

export default [
  // ESM build (for bundlers)
  {
    input: 'src/index.ts',
    output: {
      file: 'dist/blur-reveal-input.esm.js',
      format: 'es',
      sourcemap: true,
      banner,
    },
    plugins: [
      typescript({
        tsconfig: './tsconfig.json',
        declaration: false,
      }),
    ],
  },
  // UMD build (auto-apply for CDN)
  {
    input: 'src/auto-apply.ts',
    output: {
      file: 'dist/blur-reveal-input.js',
      format: 'umd',
      name: 'BlurRevealInput',
      sourcemap: true,
      banner,
    },
    plugins: [
      typescript({
        tsconfig: './tsconfig.json',
        declaration: false,
      }),
    ],
  },
  // Minified UMD (CDN production)
  {
    input: 'src/auto-apply.ts',
    output: {
      file: 'dist/blur-reveal-input.min.js',
      format: 'umd',
      name: 'BlurRevealInput',
      banner,
    },
    plugins: [
      typescript({
        tsconfig: './tsconfig.json',
        declaration: false,
      }),
      terser({
        format: {
          comments: /^!/,
        },
      }),
    ],
  },
  // IIFE build (script tag without module system)
  {
    input: 'src/auto-apply.ts',
    output: {
      file: 'dist/blur-reveal-input.iife.js',
      format: 'iife',
      name: 'BlurRevealInput',
      sourcemap: true,
      banner,
    },
    plugins: [
      typescript({
        tsconfig: './tsconfig.json',
        declaration: false,
      }),
    ],
  },
  // Type declarations
  {
    input: 'src/index.ts',
    output: {
      file: 'dist/blur-reveal-input.d.ts',
      format: 'es',
    },
    plugins: [dts()],
  },
];
