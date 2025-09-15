/**
 * ESLint Plugin: keyboard-awareness
 * React Native uygulamalarında keyboard handling best practices
 */

const keyboardAwarenessRule = require('../eslint-rules/keyboard-awareness');

module.exports = {
  rules: {
    'require-keyboard-aware': keyboardAwarenessRule,
  },
  configs: {
    recommended: {
      plugins: ['keyboard-awareness'],
      rules: {
        'keyboard-awareness/require-keyboard-aware': 'warn',
      },
    },
  },
};
