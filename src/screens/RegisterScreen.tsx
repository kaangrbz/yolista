import React, { useState } from 'react';
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
import { useAuth } from '../context/AuthContext';
import { Logo } from '../components/Logo';
import { showToast } from '../utils/alert';
import { useNavigation } from '@react-navigation/native';

export const RegisterScreen = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { signUp } = useAuth();
  const navigation = useNavigation();
  const handleRegister = async () => {
    if (!email || !password || !name || !username) {
      showToast(
        'error',
        'Lütfen tüm alanları doldurun',
      );
      return;
    }

    if (password.length < 6) {
      showToast(
        'error',
        'Şifre en az 6 karakter olmalıdır',
      );
      return;
    }

    try {
      setIsLoading(true);
      await signUp(email, password, name, username);
      showToast(
        'success',
        'Hesabınız oluşturuldu.',
      );
    } catch (error: any) {
      showToast(
        'error',
        error.message || 'Kayıt olurken bir hata oluştu',
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (

    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === "ios" ? "padding" : "height"}>
      <View style={styles.header}>
        <Logo size="large" color="#1DA1F2" />
        <Text style={styles.subtitle}>Seyahat tutkunları için en özel rotaları keşfet ve unutulmaz bir deneyime adım at!</Text>
      </View>

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
        <TextInput
          style={styles.input}
          placeholder="Şifre"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          autoCapitalize="none"
          autoCorrect={false}
          autoComplete="password"
          textContentType="password"
          returnKeyType="done"
          blurOnSubmit={true}

          placeholderTextColor="#666"
          enablesReturnKeyAutomatically
        />

        <TouchableOpacity
          style={[styles.button, isLoading && styles.buttonDisabled]}
          onPress={handleRegister}
          disabled={isLoading}>
          {isLoading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Kayıt Ol</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity onPress={() => navigation.navigate('Login')}>
          <Text style={styles.loginText}>Zaten bir hesabınız var mı? Giriş yap</Text>
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
});
