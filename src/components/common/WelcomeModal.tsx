import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { Logo } from '../Logo';
import { useAuthTheme } from '../../context/AppThemeContext';
import { useAuthThemedStyles } from '../../theme/useAuthThemedStyles';
import AppModal from './AppModal';

interface WelcomeModalProps {
  visible: boolean;
  onDismiss: () => void;
}

interface WelcomeFeature {
  icon: string;
  title: string;
  description: string;
}

const welcomeFeatures: WelcomeFeature[] = [
  {
    icon: 'map-marker-path',
    title: 'Rotaları keşfet',
    description: 'Şehir içi, doğa ve tarihi rotaları tek akışta gör.',
  },
  {
    icon: 'compass-outline',
    title: 'Yeni yerler bul',
    description: 'Topluluğun paylaştığı güzergâhlarla ilham al.',
  },
  {
    icon: 'share-variant-outline',
    title: 'Rotanı paylaş',
    description: 'Deneyimlerini kaydet ve Yolista topluluğuyla buluştur.',
  },
];

const WelcomeModal: React.FC<WelcomeModalProps> = ({ visible, onDismiss }) => {
  const theme = useAuthTheme();
  const styles = useAuthThemedStyles((t) => ({
    features: {
      gap: 12,
    },
    featureRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      backgroundColor: t.inputBg,
      borderRadius: 16,
      padding: 14,
      borderWidth: 1,
      borderColor: t.inputBorder,
    },
    featureIconWrap: {
      width: 44,
      height: 44,
      borderRadius: 14,
      backgroundColor: t.inputFocusBg,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 12,
      borderWidth: 1,
      borderColor: t.cardBorder,
    },
    featureText: {
      flex: 1,
      paddingTop: 2,
    },
    featureTitle: {
      fontSize: 15,
      fontWeight: '700',
      color: t.textPrimary,
      marginBottom: 4,
    },
    featureDescription: {
      fontSize: 13,
      lineHeight: 19,
      color: t.textSecondary,
    },
  }));

  const handleStart = () => {
    onDismiss();
  };

  return (
    <AppModal
      visible={visible}
      onClose={onDismiss}
      title="Yolista'ya hoş geldin!"
      message="Rotanı keşfet, paylaş ve şehrini yeni bir gözle yaşamaya başla."
      hero={<Logo size="large" color={theme.primary} />}
      showCloseButton={true}
      dismissOnBackdrop={false}
      primaryAction={{
        label: 'Keşfetmeye başla',
        onPress: handleStart,
      }}
    >
      <View style={styles.features}>
        {welcomeFeatures.map((feature) => (
          <View key={feature.title} style={styles.featureRow}>
            <View style={styles.featureIconWrap}>
              <Icon name={feature.icon} size={22} color={theme.primary} />
            </View>
            <View style={styles.featureText}>
              <Text style={styles.featureTitle}>{feature.title}</Text>
              <Text style={styles.featureDescription}>{feature.description}</Text>
            </View>
          </View>
        ))}
      </View>
    </AppModal>
  );
};

export default WelcomeModal;
