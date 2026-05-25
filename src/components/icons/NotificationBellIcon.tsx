import React from 'react';
import Svg, { Path } from 'react-native-svg';
import { useAppTheme } from '../../context/AppThemeContext';

interface NotificationBellIconProps {
  size?: number;
  color?: string;
}

export const NotificationBellIcon: React.FC<NotificationBellIconProps> = ({
  size = 24,
  color,
}) => {
  const theme = useAppTheme();
  const strokeColor = color ?? theme.textPrimary;

  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 4.2 C9.35 4.2 7.2 6.35 7.2 9 V10.6 C7.2 11.35 6.95 12.05 6.55 12.6 L5.4 14.3 C4.95 14.95 5.4 15.8 6.2 15.8 H17.8 C18.6 15.8 19.05 14.95 18.6 14.3 L17.45 12.6 C17.05 12.05 16.8 11.35 16.8 10.6 V9 C16.8 6.35 14.65 4.2 12 4.2 Z"
        stroke={strokeColor}
        strokeWidth={1.85}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M10.2 15.8 C10.45 17.05 11.15 18 12 18 C12.85 18 13.55 17.05 13.8 15.8"
        stroke={strokeColor}
        strokeWidth={1.85}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
};
