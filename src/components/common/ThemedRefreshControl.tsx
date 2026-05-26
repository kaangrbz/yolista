import React from 'react';
import { RefreshControl, type RefreshControlProps } from 'react-native';
import { useAppTheme } from '../../context/AppThemeContext';

const DEFAULT_SPINNER_COLOR = '#1DA1F2';

export type ThemedRefreshControlProps = Omit<
  RefreshControlProps,
  'tintColor' | 'colors' | 'progressBackgroundColor' | 'titleColor'
> & {
  spinnerColor?: string;
};

const ThemedRefreshControl: React.FC<ThemedRefreshControlProps> = ({
  spinnerColor = DEFAULT_SPINNER_COLOR,
  ...props
}) => {
  const theme = useAppTheme();

  return (
    <RefreshControl
      {...props}
      tintColor={spinnerColor}
      colors={[spinnerColor]}
      progressBackgroundColor={theme.background}
      titleColor={theme.textSecondary}
    />
  );
};

export default ThemedRefreshControl;
