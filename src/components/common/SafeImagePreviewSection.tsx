import React from 'react';
import { View, ViewProps } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface SafeImagePreviewSectionProps extends ViewProps {
  children: React.ReactNode;
  applyTopInset?: boolean;
  applyBottomInset?: boolean;
}

const SafeImagePreviewSection: React.FC<SafeImagePreviewSectionProps> = ({
  children,
  applyTopInset = false,
  applyBottomInset = false,
  style,
  ...rest
}) => {
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[
        applyTopInset && { paddingTop: insets.top },
        applyBottomInset && { paddingBottom: insets.bottom },
        style,
      ]}
      {...rest}
    >
      {children}
    </View>
  );
};

export default SafeImagePreviewSection;
