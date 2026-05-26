import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useThemedStyles } from '../../../theme/useThemedStyles';

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
  const styles = useThemedStyles((t) => ({
    container: {
      backgroundColor: t.background,
      paddingBottom: 4,
    },
    handle: {
      alignSelf: 'center',
      width: 36,
      height: 4,
      borderRadius: 2,
      backgroundColor: t.borderStrong,
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
      color: t.textMuted,
    },
    title: {
      flex: 1,
      fontSize: 17,
      fontWeight: '700',
      color: t.textPrimary,
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
      color: t.borderStrong,
    },
  }));

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

export default ProfileEditHeader;
