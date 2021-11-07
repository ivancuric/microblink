/* eslint-env node */

module.exports = {
  root: true,

  parser: '@typescript-eslint/parser',
  plugins: ['@typescript-eslint'],

  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/eslint-recommended',
    'plugin:@typescript-eslint/recommended',
    'prettier',
  ],
  rules: {
    '@typescript-eslint/explicit-module-boundary-types': 0,
    '@typescript-eslint/no-explicit-any': 0,
    '@typescript-eslint/ban-ts-comment': 0,
    '@typescript-eslint/no-non-null-assertion': 0,
  },
  // rules: {
  //   '@typescript-eslint/no-use-before-define': 'off',
  //   '@typescript-eslint/explicit-function-return-type': 'off',
  // },
};
