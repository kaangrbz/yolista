import React from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ViewStyle,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { authTheme } from '../../theme/authTheme';

export interface AppModalAction {
  label: string;
  onPress: () => void;
}

interface AppModalProps {
  visible: boolean;
  onClose: () => void;
  title: string;
  message?: string;
  icon?: string;
  iconColor?: string;
  children?: React.ReactNode;
  primaryAction?: AppModalAction;
  secondaryAction?: AppModalAction;
  showCloseButton?: boolean;
  dismissOnBackdrop?: boolean;
  contentStyle?: ViewStyle;
}

const AppModal: React.FC<AppModalProps> = ({
  visible,
  onClose,
  title,
  message,
  icon,
  iconColor = authTheme.primary,
  children,
  primaryAction,
  secondaryAction,
  showCloseButton = true,
  dismissOnBackdrop = true,
  contentStyle,
}) => {
  const handleBackdropPress = () => {
    if (!dismissOnBackdrop) {
      return;
    }

    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={handleBackdropPress} />

        <View style={[styles.card, contentStyle]}>
          {showCloseButton ? (
            <TouchableOpacity
              onPress={onClose}
              style={styles.closeButton}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              accessibilityLabel="Kapat"
              accessibilityRole="button"
            >
              <Icon name="close" size={22} color={authTheme.textMuted} />
            </TouchableOpacity>
          ) : null}

          <ScrollView
            bounces={false}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            {icon ? (
              <View style={styles.heroOuter}>
                <View style={styles.heroInner}>
                  <Icon name={icon} size={40} color={iconColor} />
                </View>
              </View>
            ) : null}

            <Text style={styles.title}>{title}</Text>

            {message ? <Text style={styles.message}>{message}</Text> : null}

            {children ? <View style={styles.body}>{children}</View> : null}
          </ScrollView>

          {primaryAction || secondaryAction ? (
            <View style={styles.footer}>
              {primaryAction ? (
                <TouchableOpacity
                  style={styles.primaryButton}
                  onPress={primaryAction.onPress}
                  activeOpacity={0.85}
                  accessibilityRole="button"
                >
                  <Text style={styles.primaryButtonText}>{primaryAction.label}</Text>
                  <Icon name="arrow-right" size={20} color="#FFFFFF" />
                </TouchableOpacity>
              ) : null}

              {secondaryAction ? (
                <TouchableOpacity
                  style={styles.secondaryButton}
                  onPress={secondaryAction.onPress}
                  activeOpacity={0.7}
                  accessibilityRole="button"
                >
                  <Text style={styles.secondaryButtonText}>{secondaryAction.label}</Text>
                </TouchableOpacity>
              ) : null}
            </View>
          ) : null}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(15, 23, 42, 0.52)',
  },
  card: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: '#FFFFFF',
    borderRadius: 28,
    paddingTop: 28,
    paddingHorizontal: 24,
    paddingBottom: 24,
    borderWidth: 1,
    borderColor: authTheme.cardBorder,
    shadowColor: authTheme.shadow,
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.22,
    shadowRadius: 28,
    elevation: 12,
    maxHeight: '88%',
  },
  closeButton: {
    position: 'absolute',
    top: 14,
    right: 14,
    zIndex: 2,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: authTheme.inputBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    alignItems: 'center',
    paddingTop: 4,
    paddingBottom: 8,
  },
  heroOuter: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: authTheme.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  heroInner: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: authTheme.cardBorder,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: authTheme.textPrimary,
    textAlign: 'center',
    letterSpacing: -0.3,
    marginBottom: 10,
  },
  message: {
    fontSize: 15,
    lineHeight: 23,
    color: authTheme.textSecondary,
    textAlign: 'center',
    marginBottom: 4,
  },
  body: {
    width: '100%',
    marginTop: 18,
  },
  footer: {
    width: '100%',
    marginTop: 8,
    gap: 10,
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: authTheme.primary,
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  secondaryButton: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  secondaryButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: authTheme.textSecondary,
  },
});

export default AppModal;
