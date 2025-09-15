import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Platform,
  Animated,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {
  getValidationMessage,
  validateEmail,
  validatePassword,
  validateUsername,
  validateName,
} from '../../../utils/validationUtils';
import UserModel from '../../../model/user.model';

interface RegisterFormProps {
  onRegister: (email: string, password: string, name: string, username: string) => Promise<void>;
  onNavigateToLogin: () => void;
  fadeAnim: Animated.Value;
  scaleAnim: Animated.Value;
}

const RegisterForm: React.FC<RegisterFormProps> = ({
  onRegister,
  onNavigateToLogin,
  fadeAnim,
  scaleAnim,
}) => {
  // Note: Parent RegisterScreen already uses KeyboardAvoidingView
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [focusedField, setFocusedField] = useState<string | null>(null);

  const validateForm = () => {
    if (!validateName(name)) {
      setError(getValidationMessage('name', name));
      return false;
    }

    if (!validateUsername(username)) {
      setError(getValidationMessage('username', username));
      return false;
    }

    const isUsernameAvailable = UserModel.isUsernameAvailable(username);
    if (!isUsernameAvailable) {
      setError('Bu kullanıcı adı zaten kullanılıyor');
      return false;
    }

    if (!validateEmail(email)) {
      setError(getValidationMessage('email', email));
      return false;
    }
    if (!validatePassword(password)) {
      setError(getValidationMessage('password', password));
      return false;
    }
    return true;
  };

  const handleRegister = async () => {
    if (!validateForm()) {return;}

    try {
      setIsRegistering(true);
      setError('');
      await onRegister(email, password, name, username);
    } catch (error: any) {
      setError(error.message || 'Kayıt olurken bir hata oluştu');
    } finally {
      setIsRegistering(false);
    }
  };

  const isFormValid = name.length > 0 && username.length > 0 && email.length > 0 && password.length > 0;

  const getFieldIcon = (field: string) => {
    const isFocused = focusedField === field;
    const color = isFocused ? '#1DA1F2' : '#666';

    switch (field) {
      case 'name':
        return <Icon name="account-outline" size={20} color={color} />;
      case 'username':
        return <Icon name="at" size={20} color={color} />;
      case 'email':
        return <Icon name="email-outline" size={20} color={color} />;
      case 'password':
        return <Icon name="lock-outline" size={20} color={color} />;
      default:
        return null;
    }
  };

  return (
    <Animated.View
      style={[
        styles.container,
        {
          opacity: fadeAnim,
          transform: [{ scale: scaleAnim }],
        },
      ]}
    >
        <View style={styles.formContainer}>
          {/* Error Message */}
          {error ? (
            <View style={styles.errorContainer}>
              <Icon name="alert-circle-outline" size={20} color="#dc2626" />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          {/* Name Input */}
          <View style={styles.inputContainer}>
            <View style={[
              styles.inputWrapper,
              focusedField === 'name' && styles.inputWrapperFocused,
            ]}>
              {getFieldIcon('name')}
              <TextInput
                style={styles.input}
                placeholder="Ad Soyad"
                value={name}
                onChangeText={setName}
                onFocus={() => setFocusedField('name')}
                onBlur={() => setFocusedField(null)}
                autoCapitalize="words"
                autoCorrect={false}
                autoComplete="name"
                textContentType="name"
                returnKeyType="next"
                blurOnSubmit={false}
                placeholderTextColor="#999"
                enablesReturnKeyAutomatically
              />
            </View>
          </View>

          {/* Username Input */}
          <View style={styles.inputContainer}>
            <View style={[
              styles.inputWrapper,
              focusedField === 'username' && styles.inputWrapperFocused,
            ]}>
              {getFieldIcon('username')}
              <TextInput
                style={styles.input}
                placeholder="Kullanıcı Adı"
                value={username}
                onChangeText={setUsername}
                onFocus={() => setFocusedField('username')}
                onBlur={() => setFocusedField(null)}
                autoCapitalize="none"
                autoComplete="username"
                textContentType="username"
                returnKeyType="next"
                blurOnSubmit={false}
                placeholderTextColor="#999"
                enablesReturnKeyAutomatically
              />
            </View>
          </View>

          {/* Email Input */}
          <View style={styles.inputContainer}>
            <View style={[
              styles.inputWrapper,
              focusedField === 'email' && styles.inputWrapperFocused,
            ]}>
              {getFieldIcon('email')}
              <TextInput
                style={styles.input}
                placeholder="E-posta adresiniz"
                value={email}
                onChangeText={setEmail}
                onFocus={() => setFocusedField('email')}
                onBlur={() => setFocusedField(null)}
                autoCapitalize="none"
                keyboardType="email-address"
                autoCorrect={false}
                autoComplete="email"
                textContentType="emailAddress"
                returnKeyType="next"
                blurOnSubmit={false}
                placeholderTextColor="#999"
                enablesReturnKeyAutomatically
              />
            </View>
          </View>

          {/* Password Input */}
          <View style={styles.inputContainer}>
            <View style={[
              styles.inputWrapper,
              focusedField === 'password' && styles.inputWrapperFocused,
            ]}>
              {getFieldIcon('password')}
              <TextInput
                style={styles.input}
                placeholder="Şifreniz"
                value={password}
                onChangeText={setPassword}
                onFocus={() => setFocusedField('password')}
                onBlur={() => setFocusedField(null)}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                autoCorrect={false}
                autoComplete="password"
                textContentType="password"
                returnKeyType="done"
                blurOnSubmit={true}
                placeholderTextColor="#999"
                enablesReturnKeyAutomatically
              />
              <TouchableOpacity
                onPress={() => setShowPassword(!showPassword)}
                style={styles.eyeIcon}
              >
                <Icon
                  name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                  size={20}
                  color="#666"
                />
              </TouchableOpacity>
            </View>
          </View>

          {/* Register Button */}
          <TouchableOpacity
            style={[
              styles.registerButton,
              !isFormValid && styles.registerButtonDisabled,
            ]}
            onPress={handleRegister}
            disabled={isRegistering || !isFormValid}
            activeOpacity={0.8}
          >
            {isRegistering ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <>
                <Text style={styles.registerButtonText}>Kayıt Ol</Text>
                <Icon name="arrow-right" size={20} color="#fff" />
              </>
            )}
          </TouchableOpacity>

          {/* Divider */}
          <View style={styles.dividerContainer}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>veya</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* Login Link */}
          <TouchableOpacity
            onPress={onNavigateToLogin}
            style={styles.loginContainer}
            activeOpacity={0.7}
          >
            <Text style={styles.loginText}>
              Zaten hesabınız var mı? <Text style={styles.loginLink}>Giriş yapın</Text>
            </Text>
          </TouchableOpacity>
        </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 20,
  },
  formContainer: {
    flex: 1,
    justifyContent: 'center',
    gap: 16,
    paddingVertical: 20,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fef2f2',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#fecaca',
    marginBottom: 8,
  },
  errorText: {
    color: '#dc2626',
    fontSize: 14,
    marginLeft: 8,
    flex: 1,
  },
  inputContainer: {
    marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e9ecef',
    paddingHorizontal: 16,
    paddingVertical: Platform.OS === 'ios' ? 16 : 12,
  },
  inputWrapperFocused: {
    borderColor: '#1DA1F2',
    backgroundColor: '#fff',
    shadowColor: '#1DA1F2',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#333',
    padding: 0,
    marginLeft: 12,
  },
  eyeIcon: {
    padding: 4,
  },
  registerButton: {
    backgroundColor: '#1DA1F2',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 8,
    shadowColor: '#1DA1F2',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  registerButtonDisabled: {
    backgroundColor: '#ccc',
    shadowOpacity: 0,
    elevation: 0,
  },
  registerButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#e9ecef',
  },
  dividerText: {
    color: '#666',
    fontSize: 14,
    marginHorizontal: 16,
  },
  loginContainer: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  loginText: {
    fontSize: 16,
    color: '#666',
  },
  loginLink: {
    color: '#1DA1F2',
    fontWeight: '600',
  },
});

export default RegisterForm;
