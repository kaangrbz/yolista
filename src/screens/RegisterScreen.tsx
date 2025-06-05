import React, {useState} from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {useAuth} from '../context/AuthContext';
import {Logo} from '../components/Logo';
import {showToast} from '../utils/alert';
import {useNavigation} from '@react-navigation/native';
import UserModel from '../model/user.model';
import {
  getValidationMessage,
  validateEmail,
  validatePassword,
  validateUsername,
  validateName,
} from '../utils/validationUtils';

export const RegisterScreen = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [previewPassword, setPreviewPassword] = useState(false);
  const [error, setError] = useState('');
  const {signUp} = useAuth();
  const navigation = useNavigation();

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
    if (!validateForm()) return;
    setIsRegistering(true);

    try {
      await signUp(email, password, name, username);
      showToast('success', 'Hesabınız oluşturuldu.');
      setError('');
    } catch (error: any) {
      setError(error.message || 'Kayıt olurken bir hata oluştu');
    } finally {
      setIsRegistering(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <View style={styles.header}>
        <Logo size="large" color="#1DA1F2" />
        <Text style={styles.subtitle}>
          Seyahat tutkunları için en özel rotaları keşfet ve unutulmaz bir
          deneyime adım at!
        </Text>
      </View>
      <Text style={styles.errorText}>{error ? error : ' '}</Text>
      <View style={styles.form}>
        <TextInput
          style={styles.input}
          placeholder="Ad Soyad"
          value={name}
          onChangeText={setName}
          autoCapitalize="words"
          autoCorrect={false}
          autoComplete="name"
          textContentType="name"
          returnKeyType="next"
          blurOnSubmit={false}
          placeholderTextColor="#666"
          enablesReturnKeyAutomatically
        />
        <TextInput
          style={styles.input}
          placeholder="Kullanıcı Adı"
          value={username}
          onChangeText={setUsername}
          autoCapitalize="none"
          autoComplete="username"
          textContentType="username"
          returnKeyType="next"
          blurOnSubmit={false}
          placeholderTextColor="#666"
          enablesReturnKeyAutomatically
        />
        <TextInput
          style={styles.input}
          placeholder="E-posta"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
          autoCorrect={false}
          autoComplete="email"
          textContentType="emailAddress"
          returnKeyType="next"
          blurOnSubmit={false}
          placeholderTextColor="#666"
          enablesReturnKeyAutomatically
        />
        
        <View style={styles.passwordContainer}>
        <TextInput
          style={styles.input}
          placeholder="Şifre"
          value={password}
          onChangeText={setPassword}
          autoCapitalize="none"
          autoCorrect={false}
          autoComplete="password"
          textContentType="password"
          returnKeyType="done"
          blurOnSubmit={true}
          secureTextEntry={!previewPassword}
          placeholderTextColor="#666"
          enablesReturnKeyAutomatically
        />

        <TouchableOpacity style={styles.previewButton} onPress={() => setPreviewPassword(!previewPassword)}>
          <Text style={styles.previewText}>
            {previewPassword ? <Icon name="eye-outline" size={24} color="#666" /> : <Icon name="eye-off-outline" size={24} color="#666" />}
          </Text>
        </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={[styles.button, isRegistering && styles.buttonDisabled]}
          onPress={handleRegister}
          disabled={isRegistering}>
          {isRegistering ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Kayıt Ol</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity onPress={() => navigation.navigate('Login')}>
          <Text style={styles.loginText}>
            Zaten bir hesabınız var mı? Giriş yap
          </Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 20,
  },
  errorText: {
    color: '#dc2626',
    textAlign: 'center',
    marginBottom: 16,
  },
  header: {
    flex: 1 / 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginTop: 8,
  },
  form: {
    flex: 1,
    justifyContent: 'center',
    gap: 16,
  },
  input: {
    backgroundColor: '#f5f5f5',
    padding: 16,
    borderRadius: 8,
    fontSize: 16,
    ...Platform.select({
      ios: {
        paddingVertical: 12,
      },
    }),
  },
  button: {
    backgroundColor: '#1DA1F2',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },

  loginText: {
    color: '#1DA1F2',
    textAlign: 'center',
    marginTop: 16,
  },
  passwordContainer: {
    position: 'relative',
    gap: 8,
  },
  previewButton: {
    position: 'absolute',
    right: 10,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  previewText: {
    color: '#666',
    fontSize: 16,
  },
});
