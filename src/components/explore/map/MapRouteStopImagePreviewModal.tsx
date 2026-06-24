import React from 'react';
import {
  Modal,
  SafeAreaView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import type { RouteWithProfile } from '../../../model/routes.model';
import { useAppTheme } from '../../../context/AppThemeContext';
import { useThemedStyles } from '../../../theme/useThemedStyles';
import SmartImage from '../../common/smart-image/SmartImage';
import { getStopPhotoHintLabel } from '../../../utils/getStopPhotoHintLabel';

interface MapRouteStopImagePreviewModalProps {
  stop: RouteWithProfile | null;
  visible: boolean;
  onClose: () => void;
}

export const MapRouteStopImagePreviewModal: React.FC<
  MapRouteStopImagePreviewModalProps
> = ({ stop, visible, onClose }) => {
  const theme = useAppTheme();
  const userId = stop?.user_id || stop?.profiles?.id || '';
  const imageUrl = stop?.image_url || undefined;

  const styles = useThemedStyles((t) => ({
    root: {
      flex: 1,
      backgroundColor: t.mediaBackdrop,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'flex-end',
      paddingHorizontal: 16,
      paddingVertical: 8,
    },
    closeButton: {
      width: 40,
      height: 40,
      borderRadius: 20,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'rgba(255,255,255,0.12)',
    },
    body: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 16,
    },
    image: {
      width: '100%',
      height: '100%',
    },
    placeholder: {
      alignItems: 'center',
      justifyContent: 'center',
      gap: 10,
    },
    placeholderText: {
      fontSize: 14,
      color: t.onMedia,
      textAlign: 'center',
    },
    footer: {
      paddingHorizontal: 20,
      paddingBottom: 24,
      paddingTop: 8,
    },
    caption: {
      fontSize: 15,
      fontWeight: '600',
      color: t.onMedia,
      textAlign: 'center',
    },
  }));

  const caption = stop ? getStopPhotoHintLabel(stop) : '';

  return (
    <Modal
      visible={visible}
      animationType="fade"
      presentationStyle="fullScreen"
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.root}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={onClose}
            accessibilityRole="button"
            accessibilityLabel="Önizlemeyi kapat"
          >
            <Icon name="close" size={22} color={theme.onMedia} />
          </TouchableOpacity>
        </View>

        <View style={styles.body}>
          {imageUrl && userId ? (
            <SmartImage
              kind="route"
              userId={userId}
              imageUrl={imageUrl}
              imagePreviewUrl={stop?.image_preview_url}
              resizeMode="contain"
              style={[styles.image, { flex: 1, alignSelf: 'stretch' }]}
            />
          ) : (
            <View style={styles.placeholder}>
              <Icon name="image-off-outline" size={40} color={theme.onMedia} />
              <Text style={styles.placeholderText}>Bu durak için fotoğraf yok</Text>
            </View>
          )}
        </View>

        {caption ? (
          <View style={styles.footer}>
            <Text style={styles.caption} numberOfLines={2}>
              {caption}
            </Text>
          </View>
        ) : null}
      </SafeAreaView>
    </Modal>
  );
};

export default MapRouteStopImagePreviewModal;
