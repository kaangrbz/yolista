import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TextInputProps,
} from 'react-native';

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
  // Note: This component should be used within KeyboardAwareContainer in parent modal/screen
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
        placeholderTextColor="#999"
        editable={editable}
        {...textInputProps}
      />

      {error && <Text style={styles.errorText}>{error}</Text>}
      {success && <Text style={styles.successText}>{success}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
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
    color: '#333',
  },
  required: {
    color: '#e74c3c',
    fontSize: 16,
    marginLeft: 4,
  },
  input: {
    borderWidth: 1.5,
    borderColor: '#e0e0e0',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#333',
    backgroundColor: '#fff',
    minHeight: 48,
  },
  inputDisabled: {
    backgroundColor: '#F8FAFC',
    color: '#64748B',
  },
  multilineInput: {
    minHeight: 100,
    paddingTop: 14,
  },
  inputError: {
    borderColor: '#e74c3c',
    backgroundColor: '#fdf2f2',
  },
  inputSuccess: {
    borderColor: '#27ae60',
    backgroundColor: '#f2fdf2',
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
});

export default ProfileFormField;
