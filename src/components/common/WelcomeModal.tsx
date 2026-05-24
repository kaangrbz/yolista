import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { Logo } from '../Logo';
import { authTheme } from '../../theme/authTheme';
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
  const handleStart = () => {
    onDismiss();
  };

  return (
    <AppModal
      visible={visible}
      onClose={onDismiss}
      title="Yolista'ya hoş geldin!"
      message="Rotanı keşfet, paylaş ve şehrini yeni bir gözle yaşamaya başla."
      icon="map-marker-star"
      showCloseButton={true}
      dismissOnBackdrop={false}
      primaryAction={{
        label: 'Keşfetmeye başla',
        onPress: handleStart,
      }}
    >
      <View style={styles.brandRow}>
        <Logo size="small" color={authTheme.primary} />
      </View>

      <View style={styles.features}>
        {welcomeFeatures.map((feature) => (
          <View key={feature.title} style={styles.featureRow}>
            <View style={styles.featureIconWrap}>
              <Icon name={feature.icon} size={22} color={authTheme.primary} />
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

const styles = StyleSheet.create({
  brandRow: {
    alignItems: 'center',
    marginBottom: 16,
  },
  features: {
    gap: 12,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: authTheme.inputBg,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: authTheme.inputBorder,
  },
  featureIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    borderWidth: 1,
    borderColor: authTheme.cardBorder,
  },
  featureText: {
    flex: 1,
    paddingTop: 2,
  },
  featureTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: authTheme.textPrimary,
    marginBottom: 4,
  },
  featureDescription: {
    fontSize: 13,
    lineHeight: 19,
    color: authTheme.textSecondary,
  },
});

export default WelcomeModal;
