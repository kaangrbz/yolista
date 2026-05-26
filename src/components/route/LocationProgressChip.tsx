import React from 'react';
import { Text, View } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useAppTheme } from '../../context/AppThemeContext';
import { useThemedStyles } from '../../theme/useThemedStyles';

interface LocationProgressChipProps {
  locatedCount: number;
  totalCount: number;
}

export const LocationProgressChip: React.FC<LocationProgressChipProps> = ({
  locatedCount,
  totalCount,
}) => {
  const theme = useAppTheme();
  const complete = totalCount > 0 && locatedCount === totalCount;

  const styles = useThemedStyles((t) => ({
    chip: {
      flexDirection: 'row',
      alignItems: 'center',
      alignSelf: 'flex-start',
      marginTop: 8,
      paddingHorizontal: 10,
      paddingVertical: 5,
      borderRadius: 999,
      backgroundColor: complete ? t.chipSelectedBg : t.surfaceMuted,
      borderWidth: 1,
      borderColor: complete ? t.accent : t.border,
    },
    text: {
      marginLeft: 6,
      fontSize: 12,
      fontWeight: '700',
      color: complete ? t.accent : t.textSecondary,
    },
  }));

  return (
    <View style={styles.chip}>
      <Icon
        name={complete ? 'map-marker-check' : 'map-marker-outline'}
        size={14}
        color={complete ? theme.accent : theme.textSecondary}
      />
      <Text style={styles.text}>
        {locatedCount}/{totalCount} konum
      </Text>
    </View>
  );
};

export default LocationProgressChip;
