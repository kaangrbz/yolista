import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import ModalSheetSafeArea from '../common/ModalSheetSafeArea';
import { AppThemeToggle } from '../settings/AppThemeToggle';
import { useAppTheme } from '../../context/AppThemeContext';
import { useThemedStyles } from '../../theme/useThemedStyles';

interface ProfileSettingsModalProps {
  visible: boolean;
  onClose: () => void;
  onEditProfile: () => void;
  onLogout: () => void;
  onDeleteAccount: () => void;
  deleteLoading?: boolean;
}

const ProfileSettingsModal: React.FC<ProfileSettingsModalProps> = ({
  visible,
  onClose,
  onEditProfile,
  onLogout,
  onDeleteAccount,
  deleteLoading = false,
}) => {
  const theme = useAppTheme();
  const styles = useThemedStyles((t) => ({
    modalContainer: {
      flex: 1,
      justifyContent: 'flex-end',
    },
    backdrop: {
      ...StyleSheet.absoluteFill,
      backgroundColor: t.overlayDark,
    },
    sheet: {
      backgroundColor: t.background,
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      paddingBottom: 24,
      paddingHorizontal: 20,
    },
    headerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: 16,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: t.hairlineBorder,
      marginBottom: 8,
    },
    title: {
      fontSize: 18,
      fontWeight: '700',
      color: t.textPrimary,
    },
    closeButton: {
      padding: 4,
    },
    sectionLabel: {
      fontSize: 13,
      fontWeight: '600',
      color: t.textMuted,
      textTransform: 'uppercase',
      letterSpacing: 0.4,
      marginTop: 12,
      marginBottom: 8,
    },
    sectionSpacer: {
      marginTop: 20,
    },
    themeSection: {
      marginBottom: 4,
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 14,
      paddingHorizontal: 4,
      gap: 12,
      borderRadius: 12,
    },
    dangerRow: {
      marginTop: 4,
    },
    rowLabel: {
      flex: 1,
      fontSize: 16,
      color: t.textPrimary,
      fontWeight: '500',
    },
    dangerLabel: {
      flex: 1,
      fontSize: 16,
      color: '#c00',
      fontWeight: '600',
    },
  }));

  const handleEditProfile = () => {
    onClose();
    onEditProfile();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalContainer}>
        <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onClose} />
        <ModalSheetSafeArea style={styles.sheet}>
          <View style={styles.headerRow}>
            <Text style={styles.title}>Ayarlar</Text>
            <TouchableOpacity
              onPress={onClose}
              style={styles.closeButton}
              accessibilityLabel="Kapat"
            >
              <Icon name="close" size={24} color={theme.textPrimary} />
            </TouchableOpacity>
          </View>

          <Text style={styles.sectionLabel}>Görünüm</Text>
          <View style={styles.themeSection}>
            <AppThemeToggle />
          </View>

          <Text style={[styles.sectionLabel, styles.sectionSpacer]}>Profil ayarları</Text>
          <TouchableOpacity
            style={styles.row}
            onPress={handleEditProfile}
            accessibilityRole="button"
            accessibilityLabel="Profili düzenle"
          >
            <Icon name="account-edit-outline" size={22} color={theme.textPrimary} />
            <Text style={styles.rowLabel}>Profili düzenle</Text>
            <Icon name="chevron-right" size={22} color={theme.textMuted} />
          </TouchableOpacity>

          <Text style={[styles.sectionLabel, styles.sectionSpacer]}>Hesap seçenekleri</Text>
          <TouchableOpacity
            style={styles.row}
            onPress={() => {
              onClose();
              onLogout();
            }}
            accessibilityRole="button"
            accessibilityLabel="Çıkış yap"
          >
            <Icon name="logout" size={22} color={theme.textPrimary} />
            <Text style={styles.rowLabel}>Çıkış yap</Text>
            <Icon name="chevron-right" size={22} color={theme.textMuted} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.row, styles.dangerRow]}
            onPress={onDeleteAccount}
            disabled={deleteLoading}
            accessibilityRole="button"
            accessibilityLabel="Hesabımı sil"
          >
            {deleteLoading ? (
              <ActivityIndicator size="small" color="#c00" />
            ) : (
              <Icon name="account-remove-outline" size={22} color="#c00" />
            )}
            <Text style={styles.dangerLabel}>Hesabımı sil</Text>
            {!deleteLoading ? <Icon name="chevron-right" size={22} color="#c00" /> : null}
          </TouchableOpacity>
        </ModalSheetSafeArea>
      </View>
    </Modal>
  );
};

export default ProfileSettingsModal;
