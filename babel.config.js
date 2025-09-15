module.exports = {
  presets: ['module:@react-native/babel-preset'],
  plugins: [
    'react-native-reanimated/plugin',
    // Remove console.log in production
    ...(process.env.NODE_ENV === 'production' ? ['transform-remove-console'] : []),
  ],
};
