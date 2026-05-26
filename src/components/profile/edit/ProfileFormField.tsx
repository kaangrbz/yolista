// keyboard-aware-ignore: parent ekran (ProfileEditModal) zaten KeyboardAwareContainer sağlıyor
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TextInputProps,
} from 'react-native';
import { useAppTheme } from '../../../context/AppThemeContext';
import { useThemedStyles } from '../../../theme/useThemedStyles';

interface ProfileFormFieldProps extends TextInputProps {
  label: string;
  error?: string;
  success?: string;
  required?: boolean;
  multiline?: boolean;
  rows?: number;
}

const ProfileFormField: React.FC<ProfileFormFieldProps> = ({
  label,
  error,
  success,
  required = false,
  multiline = false,
  rows = 1,
  style,
  editable = true,
  ...textInputProps
}) => {
  const theme = useAppTheme();
  const styles = useThemedStyles((t) => ({
    container: {
      marginBottom: 20,
    },
    labelContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 8,
    },
    label: {
      fontSize: 16,
      fontWeight: '600',
      color: t.textPrimary,
    },
    required: {
      color: '#e74c3c',
      fontSize: 16,
      marginLeft: 4,
    },
    input: {
      borderWidth: 1.5,
      borderColor: t.borderStrong,
      borderRadius: 12,
      paddingHorizontal: 16,
      paddingVertical: 14,
      fontSize: 16,
      color: t.textPrimary,
      backgroundColor: t.surfaceMuted,
      minHeight: 48,
    },
    inputDisabled: {
      backgroundColor: t.border,
      color: t.textMuted,
    },
    multilineInput: {
      minHeight: 100,
      paddingTop: 14,
    },
    inputError: {
      borderColor: '#e74c3c',
    },
    inputSuccess: {
      borderColor: '#27ae60',
    },
    errorText: {
      color: '#e74c3c',
      fontSize: 13,
      marginTop: 6,
      fontWeight: '500',
    },
    successText: {
      color: '#27ae60',
      fontSize: 13,
      marginTop: 6,
      fontWeight: '500',
    },
  }));

  return (
    <View style={styles.container}>
      <View style={styles.labelContainer}>
        <Text style={styles.label}>{label}</Text>
        {required && <Text style={styles.required}>*</Text>}
      </View>

      <TextInput
        style={[
          styles.input,
          multiline && styles.multilineInput,
          error && styles.inputError,
          success && styles.inputSuccess,
          editable === false && styles.inputDisabled,
          style,
        ]}
        multiline={multiline}
        numberOfLines={multiline ? rows : 1}
        textAlignVertical={multiline ? 'top' : 'center'}
        placeholderTextColor={theme.textMuted}
        editable={editable}
        {...textInputProps}
      />

      {error && <Text style={styles.errorText}>{error}</Text>}
      {success && <Text style={styles.successText}>{success}</Text>}
    </View>
  );
};

export default ProfileFormField;
