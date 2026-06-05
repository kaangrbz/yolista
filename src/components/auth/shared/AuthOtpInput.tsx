// keyboard-aware-ignore: parent ekran (OtpScreen) zaten KeyboardAwareContainer sağlıyor
import React, { useRef, useState } from 'react';
import {
  NativeSyntheticEvent,
  StyleSheet,
  Text,
  TextInput,
  TextInputKeyPressEventData,
  View,
} from 'react-native';
import { AUTH_MOBILE, AUTH_OTP_LENGTH } from '../../../shared/auth-messages';
import { useAuthThemedStyles } from '../../../theme/useAuthThemedStyles';

const OTP_LENGTH = AUTH_OTP_LENGTH;

interface AuthOtpInputProps {
  value: string;
  onChange: (code: string) => void;
}

const AuthOtpInput: React.FC<AuthOtpInputProps> = ({ value, onChange }) => {
  const styles = useAuthThemedStyles((t) => ({
    label: {
      fontSize: 13,
      fontWeight: '600',
      color: t.textSecondary,
      marginBottom: 12,
      marginLeft: 4,
    },
    row: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      gap: 8,
      marginBottom: 8,
    },
    cell: {
      flex: 1,
      aspectRatio: 0.85,
      maxWidth: 52,
      borderRadius: 14,
      borderWidth: 1.5,
      borderColor: t.inputBorder,
      backgroundColor: t.inputBg,
      alignItems: 'center',
      justifyContent: 'center',
    },
    cellFocused: {
      borderColor: t.primary,
      backgroundColor: t.inputFocusBg,
      shadowColor: t.shadow,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.2,
      shadowRadius: 8,
      elevation: 3,
    },
    cellFilled: {
      borderColor: t.primary,
    },
    cellInput: {
      width: '100%',
      height: '100%',
      textAlign: 'center',
      fontSize: 22,
      fontWeight: '700',
      color: t.textPrimary,
      padding: 0,
    },
  }));

  const inputRefs = useRef<Array<TextInput | null>>([]);
  const [focusedIndex, setFocusedIndex] = useState(0);

  const digits = value.padEnd(OTP_LENGTH, ' ').split('').slice(0, OTP_LENGTH);

  const updateDigit = (index: number, char: string) => {
    const nextDigits = [...digits];
    nextDigits[index] = char;
    const nextValue = nextDigits.join('').replace(/\s/g, '').slice(0, OTP_LENGTH);
    onChange(nextValue);
  };

  const handleChange = (index: number, text: string) => {
    const sanitized = text.replace(/[^0-9]/g, '');

    if (sanitized.length === 0) {
      updateDigit(index, '');
      return;
    }

    if (sanitized.length > 1) {
      const pasted = sanitized.slice(0, OTP_LENGTH - index);
      let combined = value;

      for (let i = 0; i < pasted.length; i++) {
        const targetIndex = index + i;
        const chars = combined.padEnd(targetIndex + 1, ' ').split('');
        chars[targetIndex] = pasted[i];
        combined = chars.join('').replace(/\s/g, '');
      }

      onChange(combined.slice(0, OTP_LENGTH));

      const nextFocus = Math.min(index + pasted.length, OTP_LENGTH - 1);
      inputRefs.current[nextFocus]?.focus();
      setFocusedIndex(nextFocus);

      return;
    }

    updateDigit(index, sanitized[0]);

    if (index < OTP_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
      setFocusedIndex(index + 1);
    }
  };

  const handleKeyPress = (
    index: number,
    event: NativeSyntheticEvent<TextInputKeyPressEventData>,
  ) => {
    if (event.nativeEvent.key !== 'Backspace') {
      return;
    }

    if (digits[index] && digits[index] !== ' ') {
      updateDigit(index, '');
      return;
    }

    if (index > 0) {
      inputRefs.current[index - 1]?.focus();
      setFocusedIndex(index - 1);
      updateDigit(index - 1, '');
    }
  };

  return (
    <View>
      <Text style={styles.label}>{AUTH_MOBILE.verify.otpInputLabel}</Text>
      <View style={styles.row}>
        {digits.map((digit, index) => {
          const isActive = focusedIndex === index;
          const hasValue = digit.trim().length > 0;

          return (
            <View
              key={`otp-${index}`}
              style={[
                styles.cell,
                isActive && styles.cellFocused,
                hasValue && styles.cellFilled,
              ]}
            >
              <TextInput
                ref={(ref) => {
                  inputRefs.current[index] = ref;
                }}
                style={styles.cellInput}
                value={hasValue ? digit : ''}
                onChangeText={(text) => handleChange(index, text)}
                onKeyPress={(event) => handleKeyPress(index, event)}
                onFocus={() => setFocusedIndex(index)}
                keyboardType="number-pad"
                maxLength={OTP_LENGTH}
                selectTextOnFocus
                textContentType="oneTimeCode"
                autoComplete="sms-otp"
              />
            </View>
          );
        })}
      </View>
    </View>
  );
};

export { OTP_LENGTH };

export default AuthOtpInput;
