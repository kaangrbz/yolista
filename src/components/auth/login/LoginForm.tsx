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

interface LoginFormProps {
  onLogin: (email: string, password: string) => Promise<void>;
  onNavigateToRegister: () => void;
  fadeAnim: Animated.Value;
  scaleAnim: Animated.Value;
}

const LoginForm: React.FC<LoginFormProps> = ({
  onLogin,
  onNavigateToRegister,
  fadeAnim,
  scaleAnim,
}) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [emailFocused, setEmailFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      return;
    }

    try {
      setIsLoading(true);
      await onLogin(email, password);
    } catch (error) {
      // Error handling is done in parent component
    } finally {
      setIsLoading(false);
    }
  };

  const isFormValid = email.length > 0 && password.length > 0;

  return (
    <Animated.View 
      style={[
        styles.container,
        {
          opacity: fadeAnim,
          transform: [{ scale: scaleAnim }]
        }
      ]}
    >
      <View style={styles.formContainer}>
        {/* Email Input */}
        <View style={styles.inputContainer}>
          <View style={styles.inputWrapper}>
            <Icon 
              name="email-outline" 
              size={20} 
              color={emailFocused ? '#1DA1F2' : '#666'} 
              style={styles.inputIcon}
            />
            <TextInput
              style={[
                styles.input,
                emailFocused && styles.inputFocused,
              ]}
              placeholder="E-posta adresiniz"
              value={email}
              onChangeText={setEmail}
              onFocus={() => setEmailFocused(true)}
              onBlur={() => setEmailFocused(false)}
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
          <View style={styles.inputWrapper}>
            <Icon 
              name="lock-outline" 
              size={20} 
              color={passwordFocused ? '#1DA1F2' : '#666'} 
              style={styles.inputIcon}
            />
            <TextInput
              style={[
                styles.input,
                passwordFocused && styles.inputFocused,
              ]}
              placeholder="Şifreniz"
              value={password}
              onChangeText={setPassword}
              onFocus={() => setPasswordFocused(true)}
              onBlur={() => setPasswordFocused(false)}
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
                name={showPassword ? "eye-off-outline" : "eye-outline"} 
                size={20} 
                color="#666" 
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* Login Button */}
        <TouchableOpacity
          style={[
            styles.loginButton,
            !isFormValid && styles.loginButtonDisabled,
          ]}
          onPress={handleLogin}
          disabled={isLoading || !isFormValid}
          activeOpacity={0.8}
        >
          {isLoading ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <>
              <Text style={styles.loginButtonText}>Giriş Yap</Text>
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

        {/* Register Link */}
        <TouchableOpacity
          onPress={onNavigateToRegister}
          style={styles.registerContainer}
          activeOpacity={0.7}
        >
          <Text style={styles.registerText}>
            Hesabınız yok mu? <Text style={styles.registerLink}>Kayıt olun</Text>
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
    gap: 20,
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
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#333',
    padding: 0,
  },
  inputFocused: {
    // Focused state handled by wrapper
  },
  eyeIcon: {
    padding: 4,
  },
  loginButton: {
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
  loginButtonDisabled: {
    backgroundColor: '#ccc',
    shadowOpacity: 0,
    elevation: 0,
  },
  loginButtonText: {
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
  registerContainer: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  registerText: {
    fontSize: 16,
    color: '#666',
  },
  registerLink: {
    color: '#1DA1F2',
    fontWeight: '600',
  },
});

export default LoginForm;
