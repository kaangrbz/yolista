// keyboard-aware-ignore: parent ekranlar (AuthLayout) zaten KeyboardAwareContainer sağlıyor
import React, { useState } from 'react';
import {
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  TouchableOpacity,
  View,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import Animated, {
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { authTheme } from '../../../theme/authTheme';

const AnimatedView = Animated.createAnimatedComponent(View);

interface AuthTextInputProps extends TextInputProps {
  icon: string;
  label?: string;
  showToggle?: boolean;
}

const AuthTextInput: React.FC<AuthTextInputProps> = ({
  icon,
  label,
  showToggle = false,
  secureTextEntry,
  ...textInputProps
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const focusProgress = useSharedValue(0);

  const handleFocus = () => {
    setIsFocused(true);
    focusProgress.value = withTiming(1, { duration: 200 });
  };

  const handleBlur = () => {
    setIsFocused(false);
    focusProgress.value = withTiming(0, { duration: 200 });
  };

  const wrapperAnimatedStyle = useAnimatedStyle(() => ({
    borderColor: interpolateColor(
      focusProgress.value,
      [0, 1],
      [authTheme.inputBorder, authTheme.inputBorderFocus],
    ),
    backgroundColor: interpolateColor(
      focusProgress.value,
      [0, 1],
      [authTheme.inputBg, '#FFFFFF'],
    ),
  }));

  const isPasswordField = showToggle || secureTextEntry === true;
  const isHidden = isPasswordField && !isPasswordVisible;

  const resolvedTextContentType =
    showToggle && isPasswordVisible
      ? 'none'
      : textInputProps.textContentType;

  return (
    <View style={styles.container}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <AnimatedView style={[styles.inputWrapper, wrapperAnimatedStyle]}>
        <Icon
          name={icon}
          size={22}
          color={isFocused ? authTheme.primary : authTheme.textMuted}
          style={styles.icon}
        />
        <TextInput
          {...textInputProps}
          style={[styles.input, textInputProps.style]}
          placeholderTextColor={authTheme.textMuted}
          textContentType={resolvedTextContentType}
          secureTextEntry={isHidden}
          onFocus={(event) => {
            handleFocus();
            textInputProps.onFocus?.(event);
          }}
          onBlur={(event) => {
            handleBlur();
            textInputProps.onBlur?.(event);
          }}
        />
        {showToggle ? (
          <TouchableOpacity
            onPress={() => setIsPasswordVisible(!isPasswordVisible)}
            style={styles.toggle}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Icon
              name={isPasswordVisible ? 'eye-off-outline' : 'eye-outline'}
              size={22}
              color={authTheme.textMuted}
            />
          </TouchableOpacity>
        ) : null}
      </AnimatedView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 14,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: authTheme.textSecondary,
    marginBottom: 8,
    marginLeft: 4,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    borderWidth: 1.5,
    paddingHorizontal: 16,
    paddingVertical: Platform.OS === 'ios' ? 16 : 14,
  },
  icon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: authTheme.textPrimary,
    padding: 0,
  },
  toggle: {
    padding: 4,
    marginLeft: 8,
  },
});

export default AuthTextInput;
