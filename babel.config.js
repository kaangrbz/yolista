module.exports = {
  presets: ['module:@react-native/babel-preset'],
  plugins: [
    [
      'transform-inline-environment-variables',
      {include: ['NEXT_PUBLIC_SITE_URL']},
    ],
    'react-native-reanimated/plugin',
    // Remove console.log in production
    ...(process.env.NODE_ENV === 'production' ? ['transform-remove-console'] : []),
  ],
};
