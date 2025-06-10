import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  Image,
  ActivityIndicator,
  Platform,
  KeyboardAvoidingView,
  ScrollView,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { launchImageLibrary } from 'react-native-image-picker';
import { supabase } from '../../lib/supabase';
import { showToast } from '../../utils/alert';
import { resizeAndUploadImage, resizeImage } from '../../utils/imageUtils';
import { Profile } from '../../model/profile.model';
import UserModel from '../../model/user.model';
import { getValidationMessage, validateUsername } from '../../utils/validationUtils';
import { requestFilePermission } from '../../utils/PermissionController';
import { useAuth } from '../../context/AuthContext';
import { randomString } from '../../utils/randomString';
import RNFS from 'react-native-fs';
import { decode } from 'base64-arraybuffer';

interface ProfileEditModalProps {
  visible: boolean;
  onClose: () => void;
  profile: Profile;
  onUpdate: (updatedProfile: Profile) => void;
  imageUri: string | null;
}

const ProfileEditModal: React.FC<ProfileEditModalProps> = ({
  visible,
  onClose,
  profile,
  onUpdate,
  imageUri,
}) => {
  const [loading, setLoading] = useState(false);
  const [fullName, setFullName] = useState(profile.full_name || '');
  const [username, setUsername] = useState(profile.username || '');
  const [description, setDescription] = useState(profile.description || '');
  const [website, setWebsite] = useState(profile.website || '');
  const [imageUrl, setImageUrl] = useState(profile.image_url || '');
  const [uploadingImage, setUploadingImage] = useState(false);
  const [isUsernameChanged, setIsUsernameChanged] = useState(false);
  const [usernameCheckTimeout, setUsernameCheckTimeout] = useState<any>(null);
  const { user } = useAuth();

  // Form state
  const [formErrors, setFormErrors] = useState({
    full_name: '',
    username: '',
    description: '',
    website: '',
  });

  // Form state
  const [formSuccess, setFormSuccess] = useState({
    full_name: '',
    username: '',
    description: '',
    website: '',
  });

  const [touched, setTouched] = useState({
    full_name: false,
    username: false,
    description: false,
    website: false,
  });


  const handleImagePick = async () => {
    try {
      // First check and request permissions
      const hasPermission = await requestFilePermission();
      if (!hasPermission) {
        showToast('error', 'Dosya erişim izni gerekli');
        return;
      }

      const result = await launchImageLibrary({
        mediaType: 'photo',
        quality: 1,
        includeBase64: false,
        selectionLimit: 1,
      });

      if (result.didCancel) {
        return;
      }

      if (result.errorCode) {
        showToast('error', 'Resim seçilirken bir hata oluştu');
        return;
      }

      if (result.assets && result.assets[0]) {
        setUploadingImage(true);
        const asset = result.assets[0];

        // Upload the image
        // Resize the image
        const resizedImage = await resizeImage(asset.uri!, 200, 200, 'JPEG', 80, profile.id);

        const filePath = `${user?.id}/${randomString(16)}.jpg`;

        // Read the image file as a binary array
        const image_base64 = await RNFS.readFile(resizedImage?.uri!, 'base64');

        const { data, error } = await supabase.storage
          .from('user-profiles')
          .upload(filePath, decode(image_base64), {
            cacheControl: '3600',
            upsert: false,
            contentType: 'image/jpeg',
          });

          

          
        if (data) {
          setImageUrl(resizedImage?.uri!);

          const updateResult = await UserModel.updateUserImage(user?.id!, { image_url: data.path });

          if (!updateResult) {
            showToast('error', 'Profil fotoğrafı güncellenirken bir hata oluştu');
          } else {
            showToast('success', 'Profil fotoğrafı güncellendi');
          }
        } else {
          showToast('error', 'Resim yüklenirken bir hata oluştu');
        }
      }
    } catch (error) {
      console.error('Error picking image:', error);
      showToast('error', 'Resim seçilirken bir hata oluştu');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleChangeUsername = (value: string) => {
    setTouched({
      ...touched,
      username: true,
    });
    formErrors.username = '';
    formSuccess.username = '';

    if (!validateUsername(value)) {
      console.log('Username validation failed');
      formErrors.username = getValidationMessage('username', value);
      return;
    }


    if (value !== profile.username) {
      setIsUsernameChanged(true);

      if (usernameCheckTimeout) {
        clearTimeout(usernameCheckTimeout);
      }

      setUsernameCheckTimeout(
        setTimeout(async () => {
          console.log('Username check timeout');
          const isUsernameAvailable = await UserModel.isUsernameAvailable(username);
          if (!isUsernameAvailable) {
            console.log('Username is not available');
            setFormErrors({
              ...formErrors,
              username: 'Bu kullanıcı adı zaten kullanılıyor',
            });
          } else {

            setIsUsernameChanged(false);
            console.log('Username is available');
            setFormSuccess({
              ...formSuccess,
              username: 'Bu kullanıcı adı kullanılabilir',
            });
          }
        }, 500)
      );
    } else {
      setIsUsernameChanged(false);
    }

  };

  const handleSave = async () => {
    if (!fullName.trim() || !username.trim()) {
      showToast('error', 'İsim ve kullanıcı adı zorunludur');
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .update({
          full_name: fullName.trim(),
          username: username.trim(),
          description: description.trim(),
          website: website.trim(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', profile.id)
        .select()
        .single();

      if (error) throw error;

      if (data) {
        onUpdate(data);
        showToast('success', 'Profil başarıyla güncellendi');
        onClose();
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      showToast('error', 'Profil güncellenirken bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };


  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.modalContainer}
      >
        <View style={styles.modalContent}>
          <View style={styles.header}>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Icon name="close" size={24} color="#000" />
            </TouchableOpacity>
            <Text style={styles.title}>Profili Düzenle</Text>
            <TouchableOpacity
              disabled={loading || isUsernameChanged}
              onPress={handleSave}
              style={[styles.saveButton, isUsernameChanged && styles.saveButtonDisabled]}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#1DA1F2" />
              ) : (
                <Text style={styles.saveButtonText}>Kaydet</Text>
              )}
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.content}>
            <TouchableOpacity
              style={styles.imageContainer}
              onPress={handleImagePick}
              disabled={uploadingImage}
            >
              {uploadingImage ? (
                <ActivityIndicator size="large" color="#1DA1F2" />
              ) : (
                <>
                  <Image
                    source={{ uri: imageUri || 'https://picsum.photos/200' }}
                    style={styles.profileImage}
                  />
                  <View style={styles.imageOverlay}>
                    <Icon name="camera" size={24} color="#fff" />
                  </View>
                </>
              )}
            </TouchableOpacity>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Ad Soyad</Text>
              <TextInput
                style={styles.input}
                value={fullName}
                onChangeText={setFullName}
                placeholder="Ad Soyad"
                placeholderTextColor="#666"
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Kullanıcı Adı</Text>
              <TextInput
                style={styles.input}
                value={username}
                onChangeText={(value) => {
                  setUsername(value);
                  handleChangeUsername(value);
                }}
                placeholder="Kullanıcı Adı"
                placeholderTextColor="#666"
              />
              {formErrors.username && <Text style={styles.errorText}>{formErrors.username}</Text>}
              {formSuccess.username && <Text style={styles.successText}>{formSuccess.username}</Text>}
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Hakkımda</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={description}
                onChangeText={setDescription}
                placeholder="Kendinizden bahsedin"
                placeholderTextColor="#666"
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Website</Text>
              <TextInput
                style={styles.input}
                value={website}
                onChangeText={setWebsite}
                placeholder="Website URL"
                placeholderTextColor="#666"
                keyboardType="url"
                autoCapitalize="none"
              />
            </View>

            <View style={{ height: 100 }}></View>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 10,
    maxHeight: '90%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  closeButton: {
    padding: 5,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  saveButton: {
    padding: 5,
  },
  saveButtonDisabled: {
    opacity: 0.5,
  },
  saveButtonText: {
    color: '#1DA1F2',
    fontWeight: 'bold',
  },
  content: {
    padding: 20,
  },
  imageContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    overflow: 'hidden',
    alignSelf: 'center',
    marginBottom: 20,
  },
  profileImage: {
    width: '100%',
    height: '100%',
  },
  imageOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    color: '#333',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#333',
  },
  textArea: {
    height: 100,
    paddingTop: 12,
  },
  errorText: {
    color: 'red',
    fontSize: 12,
    marginTop: 5,
  },
  successText: {
    color: 'green',
    fontSize: 12,
    marginTop: 5,
  },
});

export default ProfileEditModal; 