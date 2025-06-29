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
import { Link, useNavigation } from '@react-navigation/native';
import { Logo } from '../components/Logo';
import { showToast } from '../utils/alert';

export const LoginScreen = () => {
  const navigation = useNavigation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { signIn } = useAuth();

  const handleLogin = async () => {
    if (!email || !password) {
      showToast('error', 'Lütfen tüm alanları doldurun');
      return;
    }

    try {
      setIsLoading(true);
      await signIn(email, password);
    } catch (error: any) {
      showToast('error', error.message || 'Giriş yaparken bir hata oluştu');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
    style={styles.container}
    behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
        <View style={styles.header}>
          <Logo size="large" color="#1DA1F2" />
          <Text style={styles.subtitle}>
            🌍 Seyahat rotalarını keşfetmek için giriş yapın! ✈️ Kişisel seyahat
            deneyimlerinizi yönetmek ve yeni maceralara atılmak için hesabınıza
            giriş yapın. Hadi başlayalım! 🚀
          </Text>
        </View>

        <View style={styles.form}>
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
            onPress={handleLogin}
            disabled={isLoading}>
            {isLoading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Giriş Yap</Text>
            )}
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => navigation.navigate('Register')}
            style={styles.registerText}>
            <Text style={styles.registerText}>
              Hesabınız yoksa buraya tıklayın
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
  header: {
    flex: 1 / 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginTop: 8,
    paddingHorizontal: 20,
    lineHeight: 24,
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
    color: '#333',
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
  registerText: {
    color: '#1DA1F2',
    textAlign: 'center',
    marginTop: 16,
  },
});
