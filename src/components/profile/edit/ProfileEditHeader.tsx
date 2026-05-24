import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';

interface ProfileEditHeaderProps {
  onClose: () => void;
  onSave: () => void;
  loading: boolean;
  canSave: boolean;
}

const ProfileEditHeader: React.FC<ProfileEditHeaderProps> = ({
  onClose,
  onSave,
  loading,
  canSave,
}) => {
  const saveDisabled = loading || !canSave;

  return (
    <View style={styles.container}>
      <View style={styles.handle} />

      <View style={styles.toolbar}>
        <TouchableOpacity
          onPress={onClose}
          style={styles.cancelButton}
          accessibilityRole="button"
          accessibilityLabel="İptal"
        >
          <Text style={styles.cancelText}>İptal</Text>
        </TouchableOpacity>

        <Text style={styles.title}>Profili düzenle</Text>

        <TouchableOpacity
          onPress={onSave}
          disabled={saveDisabled}
          style={styles.saveButton}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel="Kaydet"
        >
          {loading ? (
            <ActivityIndicator size="small" color="#1DA1F2" />
          ) : (
            <Text
              style={[
                styles.saveText,
                saveDisabled && styles.saveTextDisabled,
              ]}
            >
              Kaydet
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    paddingBottom: 4,
  },
  handle: {
    alignSelf: 'center',
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#E2E8F0',
    marginTop: 8,
    marginBottom: 12,
  },
  toolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  cancelButton: {
    minWidth: 64,
    paddingVertical: 6,
  },
  cancelText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#64748B',
  },
  title: {
    flex: 1,
    fontSize: 17,
    fontWeight: '700',
    color: '#0F172A',
    textAlign: 'center',
    letterSpacing: -0.3,
  },
  saveButton: {
    minWidth: 64,
    alignItems: 'flex-end',
    paddingVertical: 6,
  },
  saveText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1DA1F2',
  },
  saveTextDisabled: {
    color: '#CBD5E1',
  },
});

export default ProfileEditHeader;
