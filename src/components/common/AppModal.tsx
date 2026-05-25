import React from 'react';
import {
  ActivityIndicator,
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
import { useAuthTheme } from '../../context/AppThemeContext';
import { useAuthThemedStyles } from '../../theme/useAuthThemedStyles';

export type AppModalActionVariant =
  | 'primary'
  | 'secondary'
  | 'destructive'
  | 'ghost';

export interface AppModalAction {
  /** Buton kimliği / status (örn. 'cancel' | 'save' | 'discard'). onPress dışında ayırt etmek için. */
  key?: string;
  label: string;
  onPress: () => void;
  /** Default: 'primary'. Eski API: primaryAction → primary, secondaryAction → ghost olarak değerlendirilir. */
  variant?: AppModalActionVariant;
  /** Variant rengini override eder. primary/secondary/destructive için backgroundColor; ghost için text color. */
  color?: string;
  /** MaterialCommunityIcons adı. primary varyantında verilmezse default 'arrow-right' kullanılır. */
  icon?: string;
  loading?: boolean;
  disabled?: boolean;
}

interface AppModalProps {
  visible: boolean;
  onClose: () => void;
  title: string;
  message?: string;
  icon?: string;
  iconColor?: string;
  children?: React.ReactNode;
  /**
   * Dinamik buton dizisi. Verilirse `primaryAction` / `secondaryAction` yok sayılır.
   * İstendiği kadar buton verilebilir (kullanım kolaylığı için 2-4 arası önerilir).
   */
  actions?: AppModalAction[];
  /**
   * Buton yerleşimi.
   * - 'auto' (default): 2 buton varsa yatay (yan yana), aksi halde dikey.
   * - 'horizontal' / 'vertical': zorla.
   */
  actionsLayout?: 'auto' | 'horizontal' | 'vertical';
  primaryAction?: AppModalAction;
  secondaryAction?: AppModalAction;
  showCloseButton?: boolean;
  dismissOnBackdrop?: boolean;
  contentStyle?: ViewStyle;
}

/**
 * Genel amaçlı onay/bilgi modalı.
 *
 * Örnek (dinamik butonlar):
 * ```tsx
 * <AppModal
 *   visible={open}
 *   onClose={close}
 *   title="Çıkmak istiyor musun?"
 *   message="Değişikliklerin kaybolabilir."
 *   actions={[
 *     { key: 'save',    label: 'Taslağa kaydet', variant: 'primary',     icon: 'content-save-outline', onPress: handleSave },
 *     { key: 'discard', label: 'Vazgeç ve çık',  variant: 'destructive', onPress: handleDiscard },
 *     { key: 'cancel',  label: 'Devam et',       variant: 'ghost',       onPress: close },
 *   ]}
 * />
 * ```
 */
const AppModal: React.FC<AppModalProps> = ({
  visible,
  onClose,
  title,
  message,
  icon,
  iconColor,
  children,
  actions,
  actionsLayout = 'auto',
  primaryAction,
  secondaryAction,
  showCloseButton = true,
  dismissOnBackdrop = true,
  contentStyle,
}) => {
  const theme = useAuthTheme();
  const resolvedIconColor = iconColor ?? theme.primary;
  const styles = useAuthThemedStyles((t) => ({
    overlay: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 24,
    },
    backdrop: {
      ...StyleSheet.absoluteFill,
      backgroundColor: 'rgba(0, 0, 0, 0.6)',
    },
    card: {
      width: '100%',
      maxWidth: 360,
      backgroundColor: t.card,
      borderRadius: 28,
      paddingTop: 28,
      paddingHorizontal: 24,
      paddingBottom: 24,
      borderWidth: 1,
      borderColor: t.cardBorder,
      shadowColor: t.shadow,
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
      backgroundColor: t.inputBg,
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
      backgroundColor: t.primaryLight,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 20,
    },
    heroInner: {
      width: 72,
      height: 72,
      borderRadius: 36,
      backgroundColor: t.inputFocusBg,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: t.cardBorder,
    },
    title: {
      fontSize: 24,
      fontWeight: '800',
      color: t.textPrimary,
      textAlign: 'center',
      letterSpacing: -0.3,
      marginBottom: 10,
    },
    message: {
      fontSize: 15,
      lineHeight: 23,
      color: t.textSecondary,
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
    footerHorizontal: {
      flexDirection: 'row',
      alignItems: 'stretch',
    },
  }));

  const handleBackdropPress = () => {
    if (!dismissOnBackdrop) {
      return;
    }

    onClose();
  };

  const resolvedActions: AppModalAction[] = React.useMemo(() => {
    if (actions && actions.length > 0) {
      return actions;
    }

    const fallback: AppModalAction[] = [];
    if (primaryAction) {
      fallback.push({ variant: 'primary', ...primaryAction });
    }
    if (secondaryAction) {
      fallback.push({ variant: 'ghost', ...secondaryAction });
    }
    return fallback;
  }, [actions, primaryAction, secondaryAction]);

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
              <Icon name="close" size={22} color={theme.textMuted} />
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
                  <Icon name={icon} size={40} color={resolvedIconColor} />
                </View>
              </View>
            ) : null}

            <Text style={styles.title}>{title}</Text>

            {message ? <Text style={styles.message}>{message}</Text> : null}

            {children ? <View style={styles.body}>{children}</View> : null}
          </ScrollView>

          {resolvedActions.length > 0 ? (
            <View
              style={[
                styles.footer,
                (actionsLayout === 'horizontal' ||
                  (actionsLayout === 'auto' && resolvedActions.length === 2))
                  ? styles.footerHorizontal
                  : null,
              ]}>
              {resolvedActions.map((action, index) => (
                <AppModalActionButton
                  key={action.key ?? `${action.label}-${index}`}
                  action={action}
                  flex={
                    actionsLayout === 'horizontal' ||
                    (actionsLayout === 'auto' && resolvedActions.length === 2)
                  }
                />
              ))}
            </View>
          ) : null}
        </View>
      </View>
    </Modal>
  );
};

interface AppModalActionButtonProps {
  action: AppModalAction;
  flex?: boolean;
}

const AppModalActionButton: React.FC<AppModalActionButtonProps> = ({ action, flex }) => {
  const theme = useAuthTheme();
  const styles = useAuthThemedStyles((t) => ({
    actionBase: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      borderRadius: 16,
      paddingVertical: 16,
      paddingHorizontal: 20,
    },
    actionFlex: {
      flex: 1,
    },
    actionDisabled: {
      opacity: 0.6,
    },
    primaryButton: {
      backgroundColor: t.primary,
    },
    primaryButtonText: {
      fontSize: 16,
      fontWeight: '700',
      color: t.buttonText,
    },
    secondaryButton: {
      backgroundColor: t.inputBg,
    },
    secondaryButtonText: {
      fontSize: 16,
      fontWeight: '600',
      color: t.textPrimary,
    },
    destructiveButton: {
      backgroundColor: t.error,
    },
    destructiveButtonText: {
      fontSize: 16,
      fontWeight: '700',
      color: t.buttonText,
    },
    ghostButton: {
      backgroundColor: 'transparent',
    },
    ghostButtonText: {
      fontSize: 15,
      fontWeight: '600',
      color: t.textSecondary,
    },
  }));

  const variant: AppModalActionVariant = action.variant ?? 'primary';
  const isDisabled = action.disabled || action.loading;

  const containerStyle = [
    styles.actionBase,
    variant === 'primary' && styles.primaryButton,
    variant === 'secondary' && styles.secondaryButton,
    variant === 'destructive' && styles.destructiveButton,
    variant === 'ghost' && styles.ghostButton,
    flex ? styles.actionFlex : null,
    action.color && variant !== 'ghost' ? { backgroundColor: action.color } : null,
    isDisabled ? styles.actionDisabled : null,
  ];

  const textStyleByVariant = {
    primary: styles.primaryButtonText,
    secondary: styles.secondaryButtonText,
    destructive: styles.destructiveButtonText,
    ghost: styles.ghostButtonText,
  } as const;

  const textStyle = [
    textStyleByVariant[variant],
    action.color && variant === 'ghost' ? { color: action.color } : null,
  ];

  const resolvedIconColor =
    variant === 'ghost'
      ? (action.color ?? theme.textSecondary)
      : theme.buttonText;

  const showTrailingArrow = variant === 'primary' && !action.icon;
  const leadingIconName = action.icon;

  return (
    <TouchableOpacity
      style={containerStyle}
      onPress={action.onPress}
      disabled={isDisabled}
      activeOpacity={0.85}
      accessibilityRole="button"
    >
      {action.loading ? (
        <ActivityIndicator size="small" color={resolvedIconColor} />
      ) : (
        <>
          {leadingIconName ? (
            <Icon name={leadingIconName} size={18} color={resolvedIconColor} />
          ) : null}
          <Text style={textStyle}>{action.label}</Text>
          {showTrailingArrow ? (
            <Icon name="arrow-right" size={20} color={resolvedIconColor} />
          ) : null}
        </>
      )}
    </TouchableOpacity>
  );
};

export default AppModal;
