module.exports = {
  extends: ['expo'],
  ignorePatterns: ['/dist/*', '/node_modules/*', '/functions/lib/*'],
  rules: {
    '@typescript-eslint/no-explicit-any': 'off',
    'react-hooks/exhaustive-deps': 'warn',
  },
};
