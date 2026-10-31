const globals = require('globals');

module.exports = [
  {
    files: ['src/**/*.js'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'script',
      globals: { ...globals.es2021, SlidesApp: 'readonly' },
    },
    rules: {
      // Entry points are referenced by Apps Script (triggers / menu items)
      'no-unused-vars': ['error', { varsIgnorePattern: '^(onOpen|onInstall|mergeText|mergeCode)$', argsIgnorePattern: '^_|^e$' }],
    },
  },
];
