import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  Alert,
  Dimensions,
  Platform,
  Share as RNShare,
  Image,
  ScrollView,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useGlobalAlert } from '../hooks/useGlobalAlert';
import ModalSheetSafeArea from './common/ModalSheetSafeArea';
import { ShareService } from '../services/ShareService';
import { composeRouteShareText } from '../utils/composeRouteShareText';
import { useAppTheme } from '../context/AppThemeContext';
import { useThemedStyles } from '../theme/useThemedStyles';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

interface ShareModalProps {
  visible: boolean;
  onClose: () => void;
  postId: string;
  postTitle: string;
  postImage?: string;
  postUrl?: string;
  cityName?: string | null;
  categoryName?: string | null;
  stopCount?: number;
  stopTitles?: string[];
  authorUsername?: string | null;
}

const ShareModal: React.FC<ShareModalProps> = ({
  visible,
  onClose,
  postId,
  postTitle,
  postImage,
  postUrl,
  cityName,
  categoryName,
  stopCount,
  stopTitles,
  authorUsername,
}) => {
  const theme = useAppTheme();
  const styles = useThemedStyles((t) => ({
    overlay: {
      flex: 1,
      backgroundColor: t.overlayDark,
      justifyContent: 'flex-end',
    },
    modalContainer: {
      backgroundColor: t.background,
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      maxHeight: screenHeight * 0.85,
      alignSelf: 'stretch',
    },
    scrollContent: {
      flexGrow: 0,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 20,
      paddingVertical: 16,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: t.hairlineBorder,
    },
    title: {
      fontSize: 18,
      fontWeight: '600',
      color: t.textPrimary,
    },
    closeButton: {
      padding: 4,
    },
    previewContainer: {
      paddingHorizontal: 20,
      paddingVertical: 16,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: t.hairlineBorder,
    },
    previewTitle: {
      fontSize: 16,
      fontWeight: '500',
      color: t.textPrimary,
      marginBottom: 12,
    },
    previewCard: {
      flexDirection: 'row',
      backgroundColor: t.surfaceMuted,
      borderRadius: 8,
      padding: 12,
      minHeight: 80,
    },
    previewImage: {
      width: 60,
      height: 60,
      backgroundColor: t.borderStrong,
      borderRadius: 8,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 12,
      overflow: 'hidden',
    },
    previewImageContent: {
      width: '100%',
      height: '100%',
    },
    previewContent: {
      flex: 1,
      justifyContent: 'center',
      minHeight: 60,
    },
    previewPostTitle: {
      fontSize: 14,
      fontWeight: '500',
      color: t.textPrimary,
      marginBottom: 4,
      lineHeight: 18,
    },
    previewUrl: {
      fontSize: 12,
      color: t.textSecondary,
      lineHeight: 16,
    },
    messageContainer: {
      paddingHorizontal: 20,
      paddingVertical: 16,
    },
    messageLabel: {
      fontSize: 16,
      fontWeight: '500',
      color: t.textPrimary,
      marginBottom: 8,
    },
    messageInput: {
      borderWidth: 1,
      borderColor: t.border,
      borderRadius: 8,
      padding: 12,
      fontSize: 16,
      color: t.textPrimary,
      minHeight: 80,
      maxHeight: 120,
      backgroundColor: t.surfaceMuted,
    },
    characterCount: {
      fontSize: 12,
      color: t.textSecondary,
      textAlign: 'right',
      marginTop: 4,
    },
    optionsContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      paddingHorizontal: 20,
      paddingVertical: 16,
    },
    optionButton: {
      width: (screenWidth - 60) / 3,
      alignItems: 'center',
      marginBottom: 20,
    },
    optionIcon: {
      width: 50,
      height: 50,
      borderRadius: 25,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 8,
    },
    optionTitle: {
      fontSize: 12,
      color: t.textPrimary,
      textAlign: 'center',
    },
  }));

  const [customMessage, setCustomMessage] = useState('');
  const { copyToClipboard, showAlert } = useGlobalAlert();

  const resolvePostUrl = () => {
    return postUrl || ShareService.generatePostUrl(postId);
  };

  const richShareContext = {
    cityName,
    categoryName,
    stopCount,
    stopTitles,
    authorUsername,
  };

  const usesRichShare = ShareService.hasRichShareContext(richShareContext);

  const composeMessage = () => {
    const url = resolvePostUrl();

    if (usesRichShare) {
      return composeRouteShareText({
        cityName,
        categoryName,
        stopCount: stopCount ?? 0,
        stopTitles,
        authorUsername,
        url,
        customMessage,
      });
    }

    return ShareService.composeShareMessage(postTitle, url, customMessage);
  };

  const shareNativeLink = async () => {
    const url = resolvePostUrl();
    const message = usesRichShare
      ? composeRouteShareText({
          cityName,
          categoryName,
          stopCount: stopCount ?? 0,
          stopTitles,
          authorUsername,
          url,
          customMessage,
        })
      : ShareService.composeShareMessage(postTitle, url, customMessage);

    return RNShare.share({
      message,
      url: Platform.OS === 'ios' ? url : undefined,
      title: 'Yolista',
    });
  };

  const handleWhatsAppShare = async () => {
    try {
      const shared = await ShareService.shareToWhatsApp(composeMessage());

      if (shared) {
        onClose();
      } else {
        showAlert('WhatsApp açılamadı. Diğer uygulamalar seçeneğini deneyin.');
      }
    } catch (error) {
      console.error('Error sharing to WhatsApp:', error);
      Alert.alert('Hata', 'Paylaşım sırasında bir hata oluştu');
    }
  };

  const handleCopyLink = async () => {
    try {
      await copyToClipboard(composeMessage(), 'Paylaşım metni panoya kopyalandı!');
      onClose();
    } catch (error) {
      console.error('Error copying link:', error);
      showAlert('Link kopyalanırken bir hata oluştu');
    }
  };

  const handleMoreShare = async () => {
    try {
      await shareNativeLink();
      onClose();
    } catch (error) {
      console.error('Error sharing:', error);
      Alert.alert('Hata', 'Paylaşım sırasında bir hata oluştu');
    }
  };

  const shareOptions = [
    {
      id: 'whatsapp',
      title: 'WhatsApp',
      icon: 'whatsapp',
      color: '#25D366',
      onPress: handleWhatsAppShare,
    },
    {
      id: 'copy',
      title: 'Linki Kopyala',
      icon: 'content-copy',
      color: '#34C759',
      onPress: handleCopyLink,
    },
    {
      id: 'more',
      title: 'Diğer uygulamalar',
      icon: 'share-variant',
      color: '#8E8E93',
      onPress: handleMoreShare,
    },
  ];

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <ModalSheetSafeArea style={styles.modalContainer}>
          <ScrollView
            bounces={false}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
          <View style={styles.header}>
            <Text style={styles.title}>Paylaş</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Icon name="close" size={24} color={theme.textPrimary} />
            </TouchableOpacity>
          </View>

          <View style={styles.previewContainer}>
            <Text style={styles.previewTitle}>Önizleme</Text>
            <View style={styles.previewCard}>
              <View style={styles.previewImage}>
                {postImage ? (
                  <Image
                    source={{ uri: postImage }}
                    style={styles.previewImageContent}
                    resizeMode="cover"
                  />
                ) : (
                  <Icon name="image" size={40} color={theme.textMuted} />
                )}
              </View>
              <View style={styles.previewContent}>
                <Text style={styles.previewPostTitle} numberOfLines={3}>
                  {postTitle}
                </Text>
                <Text style={styles.previewUrl} numberOfLines={2}>
                  {composeMessage()}
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.messageContainer}>
            <Text style={styles.messageLabel}>Mesajınız (isteğe bağlı)</Text>
            <TextInput
              style={styles.messageInput}
              placeholder="Gönderiyle birlikte paylaşmak istediğiniz mesajı yazın..."
              placeholderTextColor={theme.textMuted}
              value={customMessage}
              onChangeText={setCustomMessage}
              multiline
              maxLength={200}
              textAlignVertical="top"
            />
            <Text style={styles.characterCount}>
              {customMessage.length}/200
            </Text>
          </View>

          <View style={styles.optionsContainer}>
            {shareOptions.map((option) => (
              <TouchableOpacity
                key={option.id}
                style={styles.optionButton}
                onPress={option.onPress}
              >
                <View style={[styles.optionIcon, { backgroundColor: option.color }]}>
                  <Icon name={option.icon} size={24} color="#fff" />
                </View>
                <Text style={styles.optionTitle}>{option.title}</Text>
              </TouchableOpacity>
            ))}
          </View>
          </ScrollView>
        </ModalSheetSafeArea>
      </View>
    </Modal>
  );
};

export default ShareModal;
