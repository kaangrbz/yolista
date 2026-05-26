import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Dimensions,
  TouchableOpacity,
  StatusBar,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useThemedStyles } from '../../theme/useThemedStyles';
import { useAppTheme } from '../../context/AppThemeContext';

const { width: screenWidth } = Dimensions.get('window');

export interface AlertConfig {
  id: string;
  message: string;
  duration?: number;
  action?: {
    label: string;
    onPress: () => void;
  };
}

interface GlobalAlertProps {
  alert: AlertConfig | null;
  onDismiss: (id: string) => void;
}

const GlobalAlert: React.FC<GlobalAlertProps> = ({ alert, onDismiss }) => {
  const theme = useAppTheme();
  const styles = useThemedStyles((t) => ({
    container: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      zIndex: 9999,
      paddingBottom: 50,
      paddingHorizontal: 16,
      paddingTop: 16,
    },
    content: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      borderRadius: 8,
      paddingHorizontal: 16,
      paddingVertical: 12,
      backgroundColor: t.id === 'light' ? '#121212' : t.surfaceMuted,
      borderWidth: t.id === 'light' ? 0 : StyleSheet.hairlineWidth,
      borderColor: t.hairlineBorder,
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: -2,
      },
      shadowOpacity: 0.25,
      shadowRadius: 3.84,
      elevation: 5,
    },
    leftContent: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
    },
    rightContent: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    message: {
      color: t.id === 'light' ? '#fff' : t.textPrimary,
      fontSize: 16,
      fontWeight: '400',
      flex: 1,
    },
    actionButton: {
      backgroundColor: t.id === 'light' ? 'rgba(255, 255, 255, 0.2)' : t.borderStrong,
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 4,
      marginRight: 8,
    },
    actionText: {
      color: t.id === 'light' ? '#fff' : t.textPrimary,
      fontSize: 14,
      fontWeight: '500',
    },
    dismissButton: {
      padding: 4,
    },
  }));

  const translateY = useRef(new Animated.Value(100)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (alert) {
      showAlert();

      // Auto dismiss after duration
      const timer = setTimeout(() => {
        hideAlert();
      }, alert.duration || 3000);

      return () => clearTimeout(timer);
    }
  }, [alert]);

  const showAlert = () => {
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const hideAlert = () => {
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: 100,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start(() => {
      if (alert) {
        onDismiss(alert.id);
      }
    });
  };

  const handleDismiss = () => {
    hideAlert();
  };

  if (!alert) {return null;}

  return (
    <Animated.View
      style={[
        styles.container,
        {
          transform: [{ translateY }],
          opacity,
        },
      ]}
    >
      <View style={styles.content}>
        <View style={styles.leftContent}>
          <Text style={styles.message}>{alert.message}</Text>
        </View>

        <View style={styles.rightContent}>
          {alert.action && (
            <TouchableOpacity
              style={styles.actionButton}
              onPress={alert.action.onPress}
            >
              <Text style={styles.actionText}>{alert.action.label}</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={styles.dismissButton}
            onPress={handleDismiss}
          >
            <Icon name="close" size={20} color={theme.id === 'light' ? '#fff' : theme.textPrimary} />
          </TouchableOpacity>
        </View>
      </View>
    </Animated.View>
  );
};

export default GlobalAlert;
