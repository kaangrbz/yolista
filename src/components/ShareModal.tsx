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
  Share as RNShare,
  Image,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import Clipboard from '@react-native-clipboard/clipboard';
import { useGlobalAlert } from '../hooks/useGlobalAlert';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

interface ShareModalProps {
  visible: boolean;
  onClose: () => void;
  postId: string;
  postTitle: string;
  postImage?: string;
  postUrl?: string;
}

const ShareModal: React.FC<ShareModalProps> = ({
  visible,
  onClose,
  postId,
  postTitle,
  postImage,
  postUrl,
}) => {
  const [customMessage, setCustomMessage] = useState('');
  const [isGeneratingLink, setIsGeneratingLink] = useState(false);
  const { copyToClipboard, showAlert } = useGlobalAlert();

  const generatePostUrl = () => {
    // Gerçek uygulamada bu URL dinamik olarak oluşturulacak
    return `https://roulista.com/post/${postId}`;
  };

  const handleShareLink = async () => {
    try {
      setIsGeneratingLink(true);
      
      const url = postUrl || generatePostUrl();
      const message = customMessage || `"${postTitle}" gönderisini inceleyin: ${url}`;
      
      await RNShare.share({
        message: message,
        url: url,
        title: postTitle,
      });
      
      onClose();
    } catch (error) {
      console.error('Error sharing:', error);
      Alert.alert('Hata', 'Paylaşım sırasında bir hata oluştu');
    } finally {
      setIsGeneratingLink(false);
    }
  };

  const handleCopyLink = async () => {
    try {
      const url = postUrl || generatePostUrl();
      await copyToClipboard(url, 'Link panoya kopyalandı!');
      onClose();
    } catch (error) {
      console.error('Error copying link:', error);
      showAlert('Link kopyalanırken bir hata oluştu');
    }
  };

  const handleSocialShare = (platform: string) => {
    const url = postUrl || generatePostUrl();
    const message = customMessage || `"${postTitle}" gönderisini inceleyin: ${url}`;
    
    // Platform-specific sharing logic
    switch (platform) {
      case 'whatsapp':
        RNShare.share({
          message: `${message} ${url}`,
          url: url,
        });
        break;
      case 'telegram':
        RNShare.share({
          message: `${message} ${url}`,
          url: url,
        });
        break;
      case 'twitter':
        RNShare.share({
          message: `${message} ${url}`,
          url: url,
        });
        break;
      default:
        RNShare.share({
          message: message,
          url: url,
          title: postTitle,
        });
    }
    
    onClose();
  };

  const shareOptions = [
    {
      id: 'link',
      title: 'Link Paylaş',
      icon: 'link-variant',
      color: '#007AFF',
      onPress: handleShareLink,
    },
    {
      id: 'copy',
      title: 'Linki Kopyala',
      icon: 'content-copy',
      color: '#34C759',
      onPress: handleCopyLink,
    },
    {
      id: 'whatsapp',
      title: 'WhatsApp',
      icon: 'whatsapp',
      color: '#25D366',
      onPress: () => handleSocialShare('whatsapp'),
    },
    {
      id: 'telegram',
      title: 'Telegram',
      icon: 'telegram',
      color: '#0088CC',
      onPress: () => handleSocialShare('telegram'),
    },
    {
      id: 'twitter',
      title: 'Twitter',
      icon: 'twitter',
      color: '#1DA1F2',
      onPress: () => handleSocialShare('twitter'),
    },
    {
      id: 'more',
      title: 'Daha Fazla',
      icon: 'dots-horizontal',
      color: '#8E8E93',
      onPress: () => RNShare.share({
        message: customMessage || `"${postTitle}" gönderisini inceleyin`,
        url: postUrl || generatePostUrl(),
        title: postTitle,
      }),
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
        <View style={styles.modalContainer}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Paylaş</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Icon name="close" size={24} color="#000" />
            </TouchableOpacity>
          </View>

          {/* Custom Message Input */}
          <View style={styles.messageContainer}>
            <Text style={styles.messageLabel}>Mesajınız (isteğe bağlı)</Text>
            <TextInput
              style={styles.messageInput}
              placeholder="Gönderiyle birlikte paylaşmak istediğiniz mesajı yazın..."
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

          {/* Share Options */}
          <View style={styles.optionsContainer}>
            {shareOptions.map((option) => (
              <TouchableOpacity
                key={option.id}
                style={styles.optionButton}
                onPress={option.onPress}
                disabled={isGeneratingLink && option.id === 'link'}
              >
                <View style={[styles.optionIcon, { backgroundColor: option.color }]}>
                  <Icon name={option.icon} size={24} color="#fff" />
                </View>
                <Text style={styles.optionTitle}>{option.title}</Text>
                {isGeneratingLink && option.id === 'link' && (
                  <View style={styles.loadingIndicator}>
                    <Icon name="loading" size={16} color="#666" />
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </View>

          {/* Post Preview */}
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
                  <Icon name="image" size={40} color="#ccc" />
                )}
              </View>
              <View style={styles.previewContent}>
                <Text style={styles.previewPostTitle} numberOfLines={3}>
                  {postTitle}
                </Text>
                <Text style={styles.previewUrl} numberOfLines={1}>
                  {postUrl || generatePostUrl()}
                </Text>
              </View>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: screenHeight * 0.85,
    minHeight: screenHeight * 0.4,
    paddingBottom: 34, // iPhone home indicator space
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
  },
  closeButton: {
    padding: 4,
  },
  messageContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  messageLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#000',
    marginBottom: 8,
  },
  messageInput: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#000',
    minHeight: 80,
    maxHeight: 120,
  },
  characterCount: {
    fontSize: 12,
    color: '#666',
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
    color: '#000',
    textAlign: 'center',
  },
  loadingIndicator: {
    position: 'absolute',
    right: 0,
    top: 0,
  },
  previewContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  previewTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#000',
    marginBottom: 12,
  },
  previewCard: {
    flexDirection: 'row',
    backgroundColor: '#f8f8f8',
    borderRadius: 8,
    padding: 12,
    minHeight: 80,
  },
  previewImage: {
    width: 60,
    height: 60,
    backgroundColor: '#e0e0e0',
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
    color: '#000',
    marginBottom: 4,
    lineHeight: 18,
  },
  previewUrl: {
    fontSize: 12,
    color: '#666',
    lineHeight: 16,
  },
});

export default ShareModal;
