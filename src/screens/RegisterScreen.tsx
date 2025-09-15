import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  Animated,
  ScrollView,
  Dimensions,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { showToast } from '../utils/alert';
import { RegisterHeader, RegisterForm } from '../components/auth';

const { height } = Dimensions.get('window');

export const RegisterScreen = () => {
  const navigation = useNavigation();
  const { signUp } = useAuth();
  const [fadeAnim] = useState(new Animated.Value(0));
  const [scaleAnim] = useState(new Animated.Value(0.9));

  // Initialize animations
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const handleRegister = async (email: string, password: string, name: string, username: string) => {
    try {
      await signUp(email, password, name, username);
      showToast('success', 'Hesabınız başarıyla oluşturuldu!');
    } catch (error: any) {
      showToast('error', error.message || 'Kayıt olurken bir hata oluştu');
      throw error; // Re-throw to handle in RegisterForm
    }
  };

  const handleNavigateToLogin = () => {
    navigation.navigate('Login' as never);
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      <KeyboardAvoidingView
        style={styles.keyboardContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}
      >
        {/* Background Gradient Effect */}
        <View style={styles.backgroundContainer}>
          <View style={styles.gradientOverlay} />
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollViewContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          bounces={false}
        >
          {/* Header */}
          <RegisterHeader
            fadeAnim={fadeAnim}
            scaleAnim={scaleAnim}
          />

          {/* Form */}
          <RegisterForm
            onRegister={handleRegister}
            onNavigateToLogin={handleNavigateToLogin}
            fadeAnim={fadeAnim}
            scaleAnim={scaleAnim}
          />

          {/* Footer */}
          <Animated.View
            style={[
              styles.footer,
              {
                opacity: fadeAnim,
                transform: [{ scale: scaleAnim }],
              },
            ]}
          >
            <View style={styles.footerContent}>
              <View style={styles.footerText}>
                <Text style={styles.footerTitle}>Yolista</Text>
                <Text style={styles.footerSubtitle}>
                  Seyahat deneyimlerinizi paylaşın, yeni rotalar keşfedin
                </Text>
              </View>
            </View>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  keyboardContainer: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollViewContent: {
    flexGrow: 1,
    minHeight: height - (Platform.OS === 'ios' ? 64 : 0),
  },
  backgroundContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: -1,
  },
  gradientOverlay: {
    flex: 1,
    backgroundColor: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
    opacity: 0.1,
  },
  footer: {
    paddingHorizontal: 20,
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
  },
  footerContent: {
    alignItems: 'center',
  },
  footerText: {
    alignItems: 'center',
  },
  footerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1DA1F2',
    marginBottom: 4,
  },
  footerSubtitle: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    lineHeight: 16,
  },
});

export default RegisterScreen;
