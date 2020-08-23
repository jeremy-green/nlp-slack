module.exports = {
  env: {
    commonjs: true,
    es2020: true,
    node: true,
  },
  extends: ['airbnb-base', 'prettier'],
  parserOptions: {
    ecmaVersion: 11,
  },
  rules: {
    'import/no-unresolved': ['error', { ignore: ['aws-sdk'] }],
    'no-unused-vars': ['error', { varsIgnorePattern: '^_' }],
  },
};
