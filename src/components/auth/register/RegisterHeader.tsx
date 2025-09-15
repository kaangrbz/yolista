import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
} from 'react-native';
import { Logo } from '../../Logo';

interface RegisterHeaderProps {
  fadeAnim: Animated.Value;
  scaleAnim: Animated.Value;
}

const RegisterHeader: React.FC<RegisterHeaderProps> = ({ fadeAnim, scaleAnim }) => {
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
      <View style={styles.logoContainer}>
        <Logo size="large" color="#1DA1F2" />
      </View>

      <View style={styles.textContainer}>
        <Text style={styles.title}>Hesap Oluşturun</Text>
        <Text style={styles.subtitle}>
          Seyahat tutkunları için en özel rotaları keşfet ve unutulmaz bir deneyime adım at!
        </Text>
      </View>

      <View style={styles.decorativeContainer}>
        <View style={styles.decorativeCircle1} />
        <View style={styles.decorativeCircle2} />
        <View style={styles.decorativeCircle3} />
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 40,
    paddingBottom: 20,
    position: 'relative',
  },
  logoContainer: {
    marginBottom: 20,
  },
  textContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1DA1F2',
    marginBottom: 12,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 10,
  },
  decorativeContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: -1,
  },
  decorativeCircle1: {
    position: 'absolute',
    top: 20,
    right: 20,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(29, 161, 242, 0.1)',
  },
  decorativeCircle2: {
    position: 'absolute',
    top: 80,
    left: 20,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(29, 161, 242, 0.05)',
  },
  decorativeCircle3: {
    position: 'absolute',
    bottom: 20,
    right: 40,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(29, 161, 242, 0.08)',
  },
});

export default RegisterHeader;
