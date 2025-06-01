import React from 'react';
import { RefreshControl } from 'react-native';

export const RefreshControlComponent = ({ refreshing, onRefresh }: { refreshing: boolean, onRefresh: () => void }) => {
  return (
    <RefreshControl
      colors={['#333', '#121212']}
      tintColor="#000000"
      titleColor="#000000"
      refreshing={refreshing}
      onRefresh={onRefresh}
    />
  );
};