import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useThemedStyles } from '../../theme/useThemedStyles';

interface RouteDetailExperienceSectionProps {
  children: React.ReactNode;
}

export const RouteDetailExperienceSection: React.FC<
  RouteDetailExperienceSectionProps
> = ({ children }) => {
  const styles = useThemedStyles((t) => ({
    section: {
      marginTop: 4,
      paddingTop: 14,
      paddingBottom: 6,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: t.border,
      backgroundColor: t.background,
    },
  }));

  return <View style={styles.section}>{children}</View>;
};

export default RouteDetailExperienceSection;
