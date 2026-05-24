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
              <Icon name="close" size={24} color="#111" />
            </TouchableOpacity>
          </View>

          <Text style={styles.sectionLabel}>Profil ayarları</Text>
          <TouchableOpacity
            style={styles.row}
            onPress={handleEditProfile}
            accessibilityRole="button"
            accessibilityLabel="Profili düzenle"
          >
            <Icon name="account-edit-outline" size={22} color="#111" />
            <Text style={styles.rowLabel}>Profili düzenle</Text>
            <Icon name="chevron-right" size={22} color="#999" />
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
            <Icon name="logout" size={22} color="#111" />
            <Text style={styles.rowLabel}>Çıkış yap</Text>
            <Icon name="chevron-right" size={22} color="#999" />
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

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
  },
  sheet: {
    backgroundColor: '#fff',
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
    borderBottomColor: '#e8e8e8',
    marginBottom: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111',
  },
  closeButton: {
    padding: 4,
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#8e8e93',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    marginTop: 12,
    marginBottom: 8,
  },
  sectionSpacer: {
    marginTop: 20,
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
    color: '#111',
    fontWeight: '500',
  },
  dangerLabel: {
    flex: 1,
    fontSize: 16,
    color: '#c00',
    fontWeight: '600',
  },
});

export default ProfileSettingsModal;
