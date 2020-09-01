module.exports = {
  env: {
    commonjs: true,
    es2020: true,
    node: true,
    jest: true,
  },
  extends: ['airbnb-base', 'prettier'],
  parserOptions: {
    ecmaVersion: 11,
  },
  settings: {
    'import/core-modules': ['aws-sdk'],
  },
  rules: {
    'import/no-unresolved': ['error', { ignore: ['aws-sdk'] }],
    'no-unused-vars': ['error', { varsIgnorePattern: '^_' }],
  },
};
