module.exports = {
  root: true,
  extends: '@react-native',
  rules: {
    // Keyboard handling best practices
    'react-native/no-unused-styles': 'warn',
    'react-native/split-platform-components': 'warn',
    'react-native/no-inline-styles': 'warn',
    'react-native/no-color-literals': 'warn',

    // Manual keyboard awareness checks
    'no-console': ['warn', { allow: ['warn', 'error'] }],
  },
  overrides: [
    {
      files: ['src/screens/**/*.tsx', 'src/components/**/*.tsx'],
      rules: {
        // Screen dosyalarında daha sıkı kontrol
        'no-console': ['error', { allow: ['warn', 'error'] }],
      },
    },
  ],
};
