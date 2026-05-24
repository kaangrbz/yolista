import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Modal,
  Platform,
  KeyboardAvoidingView,
  ScrollView,
} from 'react-native';
import { launchImageLibrary } from 'react-native-image-picker';
import { supabase } from '../../lib/supabase';
import { showToast } from '../../utils/alert';
import { resizeImage } from '../../utils/imageUtils';
import { Profile } from '../../model/profile.model';
import UserModel from '../../model/user.model';
import { getValidationMessage, validateUsername } from '../../utils/validationUtils';
import { requestPhotos } from '../../permissions';
import { useAuth } from '../../context/AuthContext';
import { randomString } from '../../utils/randomString';
import RNFS from 'react-native-fs';
import { decode } from 'base64-arraybuffer';
import {
  ProfileFormField,
  ProfileEditHeader,
  ProfileEditMediaHero,
  ProfileWebsiteFields,
  buildWebsiteEntriesFromProfile,
} from './edit';
import type { WebsiteEntry } from './edit';
import ModalSheetSafeArea from '../common/ModalSheetSafeArea';
import ProfileEmailVerification from './ProfileEmailVerification';
import { serializeWebsiteList } from '../../utils/websiteUtils';
import { useNestedScrollDragLock } from '../../hooks/useNestedScrollDragLock';

interface ProfileEditModalProps {
  visible: boolean;
  onClose: () => void;
  profile: Profile;
  onUpdate: (updatedProfile: Profile) => void;
  imageUri: string | null;
  headerImageUri: string | null;
  onImageUpdate?: (type: 'profile' | 'header', newImageUri: string, patch: Partial<Profile>) => void;
  authEmail?: string;
  isEmailConfirmed?: boolean;
  onVerifyEmailPress?: () => void;
}

interface FormState {
  fullName: string;
  username: string;
  description: string;
  websites: WebsiteEntry[];
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
  authEmail,
  isEmailConfirmed = true,
  onVerifyEmailPress,
}) => {
  const [loading, setLoading] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadingHeaderImage, setUploadingHeaderImage] = useState(false);
  const [isUsernameChanged, setIsUsernameChanged] = useState(false);
  const [usernameCheckTimeout, setUsernameCheckTimeout] = useState<any>(null);
  const { scrollEnabled, setDragInteractionActive } = useNestedScrollDragLock({
    reenableDelayMs: 1000,
  });
  const { user } = useAuth();

  // Form state
  const [formState, setFormState] = useState<FormState>({
    fullName: profile.full_name || '',
    username: profile.username || '',
    description: profile.description || '',
    websites: buildWebsiteEntriesFromProfile(profile.website),
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
        websites: buildWebsiteEntriesFromProfile(profile.website),
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
      const hasPermission = await requestPhotos();
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
        const authUserId = user?.id;

        if (!authUserId) {
          showToast('error', 'Oturum bulunamadı');
          return;
        }

        const fileBase = `${randomString(16)}.jpg`;
        const highRelative = `high/${fileBase}`;
        const previewRelative = `preview/${fileBase}`;

        const uploadBytes = async (bucketName: string, relativePath: string, localUri: string) => {
          const imageBase64 = await RNFS.readFile(localUri, 'base64');

          return supabase.storage
            .from(bucketName)
            .upload(`${authUserId}/${relativePath}`, decode(imageBase64), {
              cacheControl: '3600',
              upsert: false,
              contentType: 'image/jpeg',
            });
        };

        const removeStoragePaths = async (bucketName: string, relativePaths: string[]) => {
          if (relativePaths.length === 0) {
            return;
          }

          const fullPaths = relativePaths.map((relativePath) => `${authUserId}/${relativePath}`);
          await supabase.storage.from(bucketName).remove(fullPaths);
        };

        if (type === 'profile') {
          const bucketName = 'profiles';
          const previewResized = await resizeImage(asset.uri!, 200, 200, 'JPEG', 75, profile.id);
          const highResized = await resizeImage(asset.uri!, 800, 800, 'JPEG', 88, profile.id);

          if (!previewResized?.uri || !highResized?.uri) {
            showToast('error', 'Resim işlenirken bir hata oluştu');
            return;
          }

          const { error: highUploadError } = await uploadBytes(bucketName, highRelative, highResized.uri);

          if (highUploadError) {
            console.error('Profile high upload error:', highUploadError);
            showToast('error', 'Resim yüklenirken bir hata oluştu');
            return;
          }

          const { error: previewUploadError } = await uploadBytes(bucketName, previewRelative, previewResized.uri);

          if (previewUploadError) {
            await removeStoragePaths(bucketName, [highRelative]);
            console.error('Profile preview upload error:', previewUploadError);
            showToast('error', 'Önizleme yüklenirken bir hata oluştu');
            return;
          }

          const patch: Partial<Profile> = {
            image_url: highRelative,
            image_preview_url: previewRelative,
          };

          const updateResult = await UserModel.updateUserImage(authUserId, patch);

          if (!updateResult) {
            await removeStoragePaths(bucketName, [highRelative, previewRelative]);
            showToast('error', 'Fotoğraf güncellenirken bir hata oluştu');
            return;
          }

          showToast('success', 'Fotoğraf güncellendi');
          setLocalImageUri(previewResized.uri);
          onUpdate({ ...profile, ...patch });

          if (onImageUpdate) {
            onImageUpdate('profile', previewResized.uri, patch);
          }
        } else if (type === 'header') {
          const bucketName = 'headers';
          const previewResized = await resizeImage(asset.uri!, 960, 540, 'JPEG', 75, profile.id);
          const highResized = await resizeImage(asset.uri!, 1285, 1080, 'JPEG', 80, profile.id);

          if (!previewResized?.uri || !highResized?.uri) {
            showToast('error', 'Resim işlenirken bir hata oluştu');
            return;
          }

          const { error: highUploadError } = await uploadBytes(bucketName, highRelative, highResized.uri);

          if (highUploadError) {
            console.error('Header high upload error:', highUploadError);
            showToast('error', 'Kapak yüklenirken bir hata oluştu');
            return;
          }

          const { error: previewUploadError } = await uploadBytes(bucketName, previewRelative, previewResized.uri);

          if (previewUploadError) {
            await removeStoragePaths(bucketName, [highRelative]);
            console.error('Header preview upload error:', previewUploadError);
            showToast('error', 'Kapak önizlemesi yüklenirken bir hata oluştu');
            return;
          }

          const patch: Partial<Profile> = {
            header_image_url: highRelative,
            header_image_preview_url: previewRelative,
          };

          const updateResult = await UserModel.updateUserImage(authUserId, patch);

          if (!updateResult) {
            await removeStoragePaths(bucketName, [highRelative, previewRelative]);
            showToast('error', 'Kapak güncellenirken bir hata oluştu');
            return;
          }

          showToast('success', 'Kapak güncellendi');
          setLocalHeaderImageUri(previewResized.uri);
          onUpdate({ ...profile, ...patch });

          if (onImageUpdate) {
            onImageUpdate('header', previewResized.uri, patch);
          }
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

    if (field in formErrors && formErrors[field as keyof FormErrors]) {
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
      const websiteValues = formState.websites.map((entry) => entry.value);
      const serializedWebsite = serializeWebsiteList(websiteValues);

      const { data, error } = await supabase
        .from('profiles')
        .update({
          full_name: formState.fullName.trim(),
          username: formState.username.trim(),
          description: formState.description.trim(),
          website: serializedWebsite,
          updated_at: new Date().toISOString(),
        })
        .eq('id', profile.id)
        .select()
        .single();

      if (error) {throw error;}

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
      <View style={styles.modalContainer}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardView}
        >
          <ModalSheetSafeArea variant="full" style={styles.modalContent}>
            <ProfileEditHeader
              onClose={onClose}
              onSave={handleSave}
              loading={loading}
              canSave={!!canSave}
            />

            <ScrollView
              style={styles.content}
              contentContainerStyle={styles.scrollContent}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              contentInsetAdjustmentBehavior="automatic"
              scrollEnabled={scrollEnabled}
            >
              <ProfileEditMediaHero
                headerImageUri={localHeaderImageUri}
                profileImageUri={localImageUri}
                uploadingHeader={uploadingHeaderImage}
                uploadingProfile={uploadingImage}
                onPickHeader={() => handleImagePick('header')}
                onPickProfile={() => handleImagePick('profile')}
              />

              <View style={styles.paddedSection}>
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

                  {authEmail ? (
                    <View style={styles.emailSection}>
                      <ProfileFormField
                        label="E-posta"
                        value={authEmail}
                        editable={false}
                        placeholder="E-posta"
                        autoCapitalize="none"
                        keyboardType="email-address"
                      />
                      {onVerifyEmailPress ? (
                        <View style={styles.emailVerificationWrap}>
                          <ProfileEmailVerification
                            email={authEmail}
                            isEmailConfirmed={isEmailConfirmed}
                            onVerifyPress={onVerifyEmailPress}
                            variant="compact"
                          />
                        </View>
                      ) : null}
                    </View>
                  ) : null}

                  <ProfileFormField
                    label="Hakkımda"
                    value={formState.description}
                    onChangeText={(value) => handleFieldChange('description', value)}
                    placeholder="Kendinizden bahsedin"
                    multiline
                    rows={4}
                  />

                  <ProfileWebsiteFields
                    entries={formState.websites}
                    onChange={(websites) => {
                      setFormState((prev) => ({ ...prev, websites }));

                      if (formErrors.website) {
                        setFormErrors((prev) => ({ ...prev, website: undefined }));
                      }
                    }}
                    onDragActiveChange={setDragInteractionActive}
                    error={formErrors.website}
                  />
                </View>

                <View style={styles.bottomSpacer} />
              </View>
            </ScrollView>
          </ModalSheetSafeArea>
        </KeyboardAvoidingView>
      </View>
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
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '94%',
    flex: 1,
    overflow: 'hidden',
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  paddedSection: {
    paddingHorizontal: 20,
  },
  formSection: {
    marginTop: 4,
  },
  emailSection: {
    marginBottom: 12,
  },
  emailVerificationWrap: {
    marginTop: -10,
  },
  bottomSpacer: {
    height: 40,
  },
});

export default ProfileEditModal;
