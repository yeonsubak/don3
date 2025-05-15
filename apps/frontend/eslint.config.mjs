import { FlatCompat } from '@eslint/eslintrc';
import youMightNotNeedAnEffect from 'eslint-plugin-react-you-might-not-need-an-effect';

const compat = new FlatCompat({
  baseDirectory: import.meta.dirname,
});

const eslintConfig = [
  ...compat.config({
    extends: ['next', 'next/core-web-vitals', 'next/typescript'],
    rules: {
      '@typescript-eslint/no-unused-vars': 'off',
      'react-you-might-not-need-an-effect/you-might-not-need-an-effect': 'warn',
    },
  }),
  {
    plugins: {
      'react-you-might-not-need-an-effect': youMightNotNeedAnEffect,
    },
  },
];

export default eslintConfig;
