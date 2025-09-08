import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Modal,
  Platform,
  KeyboardAvoidingView,
  ScrollView,
  SafeAreaView,
} from 'react-native';
import { launchImageLibrary } from 'react-native-image-picker';
import { supabase } from '../../lib/supabase';
import { showToast } from '../../utils/alert';
import { resizeImage } from '../../utils/imageUtils';
import { Profile } from '../../model/profile.model';
import UserModel from '../../model/user.model';
import { getValidationMessage, validateUsername } from '../../utils/validationUtils';
import { requestFilePermission } from '../../utils/PermissionController';
import { useAuth } from '../../context/AuthContext';
import { randomString } from '../../utils/randomString';
import RNFS from 'react-native-fs';
import { decode } from 'base64-arraybuffer';
import { ProfileImageUpload, ProfileFormField, ProfileEditHeader } from './edit';

interface ProfileEditModalProps {
  visible: boolean;
  onClose: () => void;
  profile: Profile;
  onUpdate: (updatedProfile: Profile) => void;
  imageUri: string | null;
  headerImageUri: string | null;
  onImageUpdate?: (type: 'profile' | 'header', newImageUri: string) => void;
}

interface FormState {
  fullName: string;
  username: string;
  description: string;
  website: string;
}

interface FormErrors {
  fullName?: string;
  username?: string;
  description?: string;
  website?: string;
}

const ProfileEditModal: React.FC<ProfileEditModalProps> = ({
  visible,
  onClose,
  profile,
  onUpdate,
  imageUri,
  headerImageUri,
  onImageUpdate,
}) => {
  const [loading, setLoading] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadingHeaderImage, setUploadingHeaderImage] = useState(false);
  const [isUsernameChanged, setIsUsernameChanged] = useState(false);
  const [usernameCheckTimeout, setUsernameCheckTimeout] = useState<any>(null);
  const { user } = useAuth();

  // Form state
  const [formState, setFormState] = useState<FormState>({
    fullName: profile.full_name || '',
    username: profile.username || '',
    description: profile.description || '',
    website: profile.website || '',
  });

  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [usernameSuccess, setUsernameSuccess] = useState<string>('');
  
  // Local image states for modal
  const [localImageUri, setLocalImageUri] = useState<string | null>(imageUri);
  const [localHeaderImageUri, setLocalHeaderImageUri] = useState<string | null>(headerImageUri);

  // Initialize form when profile changes
  useEffect(() => {
    if (visible && profile) {
      setFormState({
        fullName: profile.full_name || '',
        username: profile.username || '',
        description: profile.description || '',
        website: profile.website || '',
      });
      setFormErrors({});
      setUsernameSuccess('');
      setLocalImageUri(imageUri);
      setLocalHeaderImageUri(headerImageUri);
    }
  }, [visible, profile, imageUri, headerImageUri]);


  const handleImagePick = async (type: 'profile' | 'header') => {
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

      if (type === 'profile') {
        setUploadingImage(true);
      } else if (type === 'header') {
        setUploadingHeaderImage(true);
      }

      if (result.assets && result.assets[0]) {
        const asset = result.assets[0];

        // Resize the image
        let resizedImage;
        let bucketName = 'profile';
        if (type === 'profile') {
          resizedImage = await resizeImage(asset.uri!, 200, 200, 'JPEG', 80, profile.id);
          bucketName = 'profiles';
        } else if (type === 'header') {
          resizedImage = await resizeImage(asset.uri!, 1285, 1080, 'JPEG', 80, profile.id);
          bucketName = 'headers';
        }

        const fileName = `${randomString(16)}.jpg`;
        const filePath = `${user?.id}/${fileName}`;

        // Read the image file as a binary array
        const image_base64 = await RNFS.readFile(resizedImage?.uri!, 'base64');

        const { data, error } = await supabase.storage
          .from(bucketName)
          .upload(filePath, decode(image_base64), {
            cacheControl: '3600',
            upsert: false,
            contentType: 'image/jpeg',
          });

        if (data) {
          

          let updateData: any;
          if (type === 'profile') {
            updateData = {
              image_url: fileName,
            };
          } else if (type === 'header') {
            updateData = {
              header_image_url: fileName,
            };
          }

          const updateResult = await UserModel.updateUserImage(user?.id!, updateData);

          if (!updateResult) {
            showToast('error', 'Fotoğraf güncellenirken bir hata oluştu');
          } else {
            showToast('success', 'Fotoğraf güncellendi');
            
            // Update local image state in modal
            if (type === 'profile') {
              setLocalImageUri(resizedImage?.uri!);
            } else if (type === 'header') {
              setLocalHeaderImageUri(resizedImage?.uri!);
            }
            
            // Notify parent component about image update
            if (onImageUpdate) {
              onImageUpdate(type, resizedImage?.uri!);
            }
          }
        } else {
          // showToast('error', 'Resim yüklenirken bir hata oluştu');
        }
      }
    } catch (error) {
      console.error('Error picking image:', error);
      showToast('error', 'Resim seçilirken bir hata oluştu');
    } finally {
      if (type === 'profile') {
        setUploadingImage(false);
      } else if (type === 'header') {
        setUploadingHeaderImage(false);
      }
    }
  };

  const handleFieldChange = (field: keyof FormState, value: string) => {
    setFormState(prev => ({ ...prev, [field]: value }));
    
    // Clear errors when user starts typing
    if (formErrors[field]) {
      setFormErrors(prev => ({ ...prev, [field]: undefined }));
    }
    
    // Handle username validation
    if (field === 'username') {
      handleUsernameChange(value);
    }
  };

  const handleUsernameChange = (value: string) => {
    setUsernameSuccess('');
    
    if (!validateUsername(value)) {
      setFormErrors(prev => ({
        ...prev,
        username: getValidationMessage('username', value),
      }));
      return;
    }

    if (value !== profile.username) {
      setIsUsernameChanged(true);

      if (usernameCheckTimeout) {
        clearTimeout(usernameCheckTimeout);
      }

      setUsernameCheckTimeout(
        setTimeout(async () => {
          const isUsernameAvailable = await UserModel.isUsernameAvailable(value);
          if (!isUsernameAvailable) {
            setFormErrors(prev => ({
              ...prev,
              username: 'Bu kullanıcı adı zaten kullanılıyor',
            }));
          } else {
            setIsUsernameChanged(false);
            setUsernameSuccess('Bu kullanıcı adı kullanılabilir');
          }
        }, 500)
      );
    } else {
      setIsUsernameChanged(false);
    }
  };

  const handleSave = async () => {
    // Validation
    if (!formState.fullName.trim() || !formState.username.trim()) {
      showToast('error', 'İsim ve kullanıcı adı zorunludur');
      return;
    }

    if (isUsernameChanged) {
      showToast('error', 'Kullanıcı adı kontrolü devam ediyor');
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .update({
          full_name: formState.fullName.trim(),
          username: formState.username.trim(),
          description: formState.description.trim(),
          website: formState.website.trim(),
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

  const canSave = formState.fullName.trim() && formState.username.trim() && !isUsernameChanged;

  const handleImagePreview = (type: 'profile' | 'header') => {
    // Bu fonksiyon ImageViewer'ı açacak
    // Şimdilik placeholder
    console.log(`Preview ${type} image`);
  };


  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.modalContainer}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardView}
        >
          <View style={styles.modalContent}>
            <ProfileEditHeader
              onClose={onClose}
              onSave={handleSave}
              loading={loading}
              canSave={!!canSave}
            />

            <ScrollView 
              style={styles.content}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              {/* Header Image Upload */}
              <ProfileImageUpload
                type="header"
                imageUri={localHeaderImageUri}
                uploading={uploadingHeaderImage}
                onPress={() => handleImagePick('header')}
              />

              {/* Profile Image Upload */}
              <ProfileImageUpload
                type="profile"
                imageUri={localImageUri}
                uploading={uploadingImage}
                onPress={() => handleImagePick('profile')}
              />

              {/* Form Fields */}
              <View style={styles.formSection}>
                <ProfileFormField
                  label="Ad Soyad"
                  value={formState.fullName}
                  onChangeText={(value) => handleFieldChange('fullName', value)}
                  placeholder="Ad Soyad"
                  required
                  error={formErrors.fullName}
                />

                <ProfileFormField
                  label="Kullanıcı Adı"
                  value={formState.username}
                  onChangeText={(value) => handleFieldChange('username', value)}
                  placeholder="Kullanıcı Adı"
                  required
                  error={formErrors.username}
                  success={usernameSuccess}
                />

                <ProfileFormField
                  label="Hakkımda"
                  value={formState.description}
                  onChangeText={(value) => handleFieldChange('description', value)}
                  placeholder="Kendinizden bahsedin"
                  multiline
                  rows={4}
                />

                <ProfileFormField
                  label="Website"
                  value={formState.website}
                  onChangeText={(value) => handleFieldChange('website', value)}
                  placeholder="Website URL"
                  keyboardType="url"
                  autoCapitalize="none"
                />
              </View>

              <View style={styles.bottomSpacer} />
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  keyboardView: {
    flex: 1,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '95%',
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  formSection: {
    marginTop: 8,
  },
  bottomSpacer: {
    height: 40,
  },
});

export default ProfileEditModal; 