import React from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { useAuthTheme } from '../../../context/AppThemeContext';
import { useAuthThemedStyles } from '../../../theme/useAuthThemedStyles';
import { ReanimatedTouchable } from '../../../utils/reanimatedComponents';

interface AuthPrimaryButtonProps {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  icon?: string;
}

const AuthPrimaryButton: React.FC<AuthPrimaryButtonProps> = ({
  label,
  onPress,
  disabled = false,
  loading = false,
  icon = 'arrow-right',
}) => {
  const theme = useAuthTheme();
  const styles = useAuthThemedStyles((t) => ({
    button: {
      backgroundColor: t.primary,
      borderRadius: 16,
      paddingVertical: 17,
      paddingHorizontal: 24,
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: 8,
      shadowColor: t.shadow,
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.35,
      shadowRadius: 16,
      elevation: 6,
    },
    buttonDisabled: {
      backgroundColor: t.buttonDisabled,
      shadowOpacity: 0,
      elevation: 0,
    },
    content: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
    },
    label: {
      color: t.buttonText,
      fontSize: 17,
      fontWeight: '700',
    },
  }));

  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    if (!disabled && !loading) {
      scale.value = withSpring(0.96, { damping: 15, stiffness: 300 });
    }
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15, stiffness: 300 });
  };

  const isDisabled = disabled || loading;

  return (
    <ReanimatedTouchable
      style={[
        styles.button,
        isDisabled && styles.buttonDisabled,
        animatedStyle,
      ]}
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={isDisabled}
      activeOpacity={0.9}
    >
      {loading ? (
        <ActivityIndicator color={theme.buttonText} size="small" />
      ) : (
        <View style={styles.content}>
          <Text style={styles.label}>{label}</Text>
          <Icon name={icon} size={22} color={theme.buttonText} />
        </View>
      )}
    </ReanimatedTouchable>
  );
};

export default AuthPrimaryButton;
