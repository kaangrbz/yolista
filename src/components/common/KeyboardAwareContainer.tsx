import React from 'react';
import {
  KeyboardAvoidingView,
  ScrollView,
  Platform,
  ViewStyle,
  ScrollViewProps,
  KeyboardAvoidingViewProps,
} from 'react-native';

interface KeyboardAwareContainerProps {
  children: React.ReactNode;
  style?: ViewStyle;
  scrollViewProps?: ScrollViewProps;
  keyboardProps?: Partial<KeyboardAvoidingViewProps>;
  enableScrollView?: boolean;
  keyboardVerticalOffset?: number;
}

/**
 * Uygulama geneli için standart KeyboardAvoidingView wrapper
 *
 * @example
 * <KeyboardAwareContainer>
 *   <YourFormComponents />
 * </KeyboardAwareContainer>
 */
const KeyboardAwareContainer: React.FC<KeyboardAwareContainerProps> = ({
  children,
  style,
  scrollViewProps = {},
  keyboardProps = {},
  enableScrollView = true,
  keyboardVerticalOffset,
}) => {
  const defaultKeyboardVerticalOffset = Platform.OS === 'ios' ? 64 : 0;
  const finalKeyboardVerticalOffset = keyboardVerticalOffset ?? defaultKeyboardVerticalOffset;

  const defaultScrollViewProps: ScrollViewProps = {
    showsVerticalScrollIndicator: false,
    keyboardShouldPersistTaps: 'handled',
    bounces: false,
    contentContainerStyle: { flexGrow: 1 },
    ...scrollViewProps,
  };

  const defaultKeyboardProps: KeyboardAvoidingViewProps = {
    behavior: Platform.OS === 'ios' ? 'padding' : 'height',
    keyboardVerticalOffset: finalKeyboardVerticalOffset,
    ...keyboardProps,
  };

  if (enableScrollView) {
    return (
      <KeyboardAvoidingView
        style={[{ flex: 1 }, style]}
        {...defaultKeyboardProps}
      >
        <ScrollView {...defaultScrollViewProps}>
          {children}
        </ScrollView>
      </KeyboardAvoidingView>
    );
  }

  return (
    <KeyboardAvoidingView
      style={[{ flex: 1 }, style]}
      {...defaultKeyboardProps}
    >
      {children}
    </KeyboardAvoidingView>
  );
};

export default KeyboardAwareContainer;
