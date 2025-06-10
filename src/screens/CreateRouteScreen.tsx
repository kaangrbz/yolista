import React, { useState, useRef, useEffect, useCallback, JSX } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  ScrollView,
  StyleSheet,
  Image,
  ActivityIndicator,
  SafeAreaView,
} from 'react-native';
import { useNavigation, useIsFocused } from '@react-navigation/native';
import { CityState, useCityStore } from '../store/cityStore';

import { supabase } from '../lib/supabase';
import { showToast } from '../utils/alert';
import { resizeImage, resizeMultipleImages, uploadImage, uploadMultipleFiles } from '../utils/imageUtils';
import { launchImageLibrary } from 'react-native-image-picker';
import { CreateRouteHeader } from '../components/header/Header';
import DropDownPicker from 'react-native-dropdown-picker';
import RouteModel, { RoutePoint } from '../model/routes.model';
import { LoadingFloatingAction } from '../components';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import CategoryModel from '../model/category.model';
import CityModel from '../model/cities.model';
import ImageResizer from 'react-native-image-resizer';
import { requestFilePermission } from '../utils/PermissionController';
import { decode, encode } from 'base64-arraybuffer';
import RNFS from 'react-native-fs';
import { randomString } from '../utils/randomString';


export const CreateRouteScreen = () => {
  const navigation = useNavigation();
  const [user, setUser] = useState<any>(null);
  const defaultSelectedCityId = useCityStore(
    (state: CityState) => state.selectedCityId,
  );
  const [cities, setCities] = useState<{ label: string; value: number, disabled: boolean }[]>([]);
  const [selectedCityId, setSelectedCityId] = useState<number>(
    defaultSelectedCityId || 0,
  );
  const [categories, setCategories] = useState<
    { label: string; value: number; icon: () => JSX.Element }[]
  >([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(
    null,
  );
  const [openCity, setOpenCity] = useState(false);
  const [openCategory, setOpenCategory] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [isLoadingCity, setIsLoadingCity] = useState(true);
  const [isLoadingCategory, setIsLoadingCategory] = useState(true);
  // Route points state
  const [routePoints, setRoutePoints] = useState<RoutePoint[]>([]);

  // Form state
  const [formErrors, setFormErrors] = useState({
    title: '',
    description: '',
    cityId: '',
    categoryId: '',
    routes: '',
  });
  const [touched, setTouched] = useState({
    title: false,
    description: false,
    cityId: false,
    categoryId: false,
    routes: false,
  });


  const isFocused = useIsFocused();


  useEffect(() => {
    if (isFocused) {
      requestFilePermission();
    }
  }, [isFocused]);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const { data, error } = await supabase.auth.getUser();
        if (error) throw error;
        setUser(data.user);
      } catch (error) {
        showToast('error', 'Lütfen tekrar giriş yapınız', 'Hata');
      }
    };
    fetchUser();
  }, []);

  useEffect(() => {
    fetchCities();
    fetchCategories();

    // Initialize with one empty route point
    if (routePoints.length === 0) {
      addRoutePoint();
    }
  }, []);



  const fetchCategories = async () => {
    try {
      setIsLoadingCategory(true);
      const categories = await CategoryModel.getCategories();

      if (categories) {
        setCategories(
          categories.map(category => ({
            label: category.name,
            value: Number(category.id),
            icon: () => (
              <Icon name={category.icon_name} size={24} color="black" />
            ),
            disabled: category.is_disabled,
          })),
        );
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
    } finally {
      setIsLoadingCategory(false);
    }
  };

  // Route management functions
  const addRoutePoint = async () => {
    const newRoutePoint: RoutePoint = {
      client_id: randomString(16),
      title: '',
      description: '',
      image_url: '',
      order_index: routePoints.length,
      is_deleted: false,
      city_id: selectedCityId,
      user_id: (await supabase.auth.getUser()).data.user?.id,
    };
    setRoutePoints([...routePoints, newRoutePoint]);
  };

  const updateRoutePoint = (
    client_id: string,
    field: keyof RoutePoint,
    value: any,
  ) => {
    setRoutePoints(
      routePoints.map(point =>
        point.client_id === client_id ? { ...point, [field]: value } : point,
      ),
    );

  };

  const updateRoutePointMultiple = (
    client_id: string,
    fields: Partial<RoutePoint>, // Only allow valid `RoutePoint` keys
  ) => {
    setRoutePoints(
      routePoints.map(point =>
        point.client_id === client_id ? { ...point, ...fields } : point,
      ),
    );
  };


  const removeRoutePoint = (id: string) => {
    if (routePoints.length <= 1) {
      showToast('warning', 'En az bir durak olmalıdır.');
      return;
    }

    // Remove the route point and reorder the remaining points
    const updatedPoints = routePoints
      .filter(point => point.client_id !== id)
      .map((point, index) => ({
        ...point,
        order_index: index,
      }));

    setRoutePoints(updatedPoints);
  };

  const moveRoutePoint = (fromIndex: number, toIndex: number) => {
    if (fromIndex === toIndex) return;

    const updatedPoints = [...routePoints];
    const [movedPoint] = updatedPoints.splice(fromIndex, 1);
    updatedPoints.splice(toIndex, 0, movedPoint);

    // Update order_index values
    const reorderedPoints = updatedPoints.map((point, index) => ({
      ...point,
      order_index: index,
    }));

    setRoutePoints(reorderedPoints);
  };


  // Bookmark functionality removed

  const fetchCities = async () => {
    try {
      setIsLoadingCity(true);
      const cities = await CityModel.getCities();

      if (cities) {
        setCities(cities.map(city => ({ label: city.name, value: city.id, disabled: city.is_disabled })));
      }
    } catch (error) {
      console.error('Error fetching cities:', error);
    } finally {
      setIsLoadingCity(false);
    }
  };

  // Validate form fields
  const validateForm = () => {
    const errors = {
      title: '',
      description: '',
      cityId: '',
      categoryId: '',
      routes: '',
    };
    let isValid = true;

    // Title validation
    const hasTitle = routePoints.every(
      point => point.title.trim() && point.title.trim().length > 0,
    );

    if (!hasTitle) {
      errors.title = 'Durak başlığı zorunludur';
      isValid = false;
    }

    // Description validation
    // if (!formData.description) {
    //     errors.description = 'Açıklama zorunludur';
    //     isValid = false;
    // } else if (formData.description.length < 10) {
    //     errors.description = 'Açıklama en az 10 karakter olmalıdır';
    //     isValid = false;
    // }

    // City validation
    if (!selectedCityId) {
      errors.cityId = 'Şehir seçimi zorunludur';
      isValid = false;
    }

    setFormErrors(errors);
    return isValid;
  };

  // Handle input blur
  const handleInputBlur = (field: string) => {
    setTouched(prev => ({
      ...prev,
      [field]: true,
    }));
    validateForm();
  };

  // Reset form
  const resetForm = () => {
    // Clear route points
    setRoutePoints([]);

    // Reset form fields
    setSelectedCityId(defaultSelectedCityId || 0);

    // Reset form errors and touched state
    setFormErrors({
      title: '',
      description: '',
      cityId: '',
      categoryId: '',
      routes: '',
    });

    setTouched({
      title: false,
      description: false,
      cityId: false,
      categoryId: false,
      routes: false,
    });

    // Add one empty route point
    addRoutePoint();
  };

  const handleImageSelect = async (client_id: string) => {
    try {
      // Check and request file permissions
      const hasPermission = await requestFilePermission();
      if (!hasPermission) {
        showToast('error', 'Dosya erişim izni reddedildi');
        return;
      }

      const result = await launchImageLibrary({
        mediaType: 'mixed',
        quality: 0.8,
        includeBase64: false,
        selectionLimit: 1,
        restrictMimeTypes: ['image/jpeg', 'image/png', 'image/jpg'],
      });

      if (result.didCancel) return;

      if (result.errorCode) {
        console.error('ImagePicker Error: ', result.errorMessage);
        showToast('error', result.errorMessage || 'Resim seçilirken bir hata oluştu');
        return;
      }

      if (result.assets && result.assets.length > 0) {
        const asset = result.assets[0];

        // Check if the image is vertical
        // if (asset.height && asset.width && asset.height > asset.width) {
        //   showToast('error', 'Lütfen yatay bir resim seçiniz');
        //   return;
        // }

        // Resize the image
        const resizedImage = await resizeImage(asset.uri!, 1285, 1080, 'JPEG', 80, client_id);

        updateRoutePoint(client_id, 'image_url', resizedImage?.uri);
      }
    } catch (error) {
      console.error('Error selecting image:', error);
      showToast('error', 'Resim seçilirken bir hata oluştu');
    }
  };

  // Upload images to Supabase
  const uploadImages = async (): Promise<{ data: any, client_id: string, fileName: string }[]> => {
    try {
      const promises = routePoints
        .filter(point => point.image_url)
        .map(async (item: RoutePoint) => {
          const fileName = `${randomString(16)}.jpg`;
          const filePath = `${user.id}/${fileName}`;

          // Read the image file as a binary array
          const image_base64 = await RNFS.readFile(item.image_url!, 'base64');

          const { data, error } = await supabase.storage
            .from('routes')
            .upload(filePath, decode(image_base64), {
              cacheControl: '3600',
              upsert: false,
              contentType: 'image/jpeg',
            });

          if (error) {
            throw error;
          }

          return { data, client_id: item.client_id!, fileName };
        });

      const results = await Promise.all(promises);

      return results;
    } catch (error) {
      console.error('Upload failed:', error.message);
      return [];
    }
  };

  const handleSubmit = async (): Promise<void> => {
    setIsPublishing(true);

    // Validate form fields
    const isValid = validateForm();
    setTouched({
      title: true,
      description: true,
      cityId: true,
      categoryId: true,
      routes: true,
    });

    try {
      if (!isValid) {
        showToast('error', 'Lütfen formu kontrol edin');
        setIsPublishing(false);
        return;
      }

      const uploadResult = await uploadImages();
      const newRoutePoints: RoutePoint[] = [];

      routePoints.forEach(point => {
        const result = uploadResult.find((result: {
          data: {
            id: string;
            path: string;
            fullPath: string;
          } | null, client_id: string, fileName: string
        }) => result.client_id === point.client_id);

        if (result) {
          newRoutePoints.push({ ...point, image_url: result.fileName });
        } else {
          newRoutePoints.push(point);
        }
      }); 

      console.log('newRoutePoints', newRoutePoints);

      const { data, error } = await RouteModel.createRoute(
        newRoutePoints,
        selectedCityId,
        selectedCategoryId,
      );

      if (error) {
        showToast('error', 'Rota eklenirken bir hata oluştu', 'Hata');
        console.error('error', error);
        return;
      }

      showToast('success', 'Rota başarıyla eklendi', 'Başarılı');
      resetForm();
      navigation.navigate('HomeStack');
    } catch (error) {
      console.error('Error creating route:', error);
      showToast('error', 'Rota oluşturulurken bir hata oluştu');
    } finally {
      setIsPublishing(false);
    }

  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: '#fff' }]}>
      <CreateRouteHeader />
      <View style={[styles.container]}>
        <View style={styles.form}>

          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>

            <View style={styles.inputContainer}>
              <Text style={[styles.label, { color: '#222' }]}>
                Şehir seç <Text style={{ color: 'red' }}>*</Text>
              </Text>

              {isLoadingCity && <ActivityIndicator size="small" color="#000" />}
              {!isLoadingCity && (
                <DropDownPicker
                  open={openCity}
                  value={selectedCityId}
                  items={cities}
                  setOpen={setOpenCity}
                  setValue={setSelectedCityId}
                  searchable
                  onChangeValue={value => {
                    if (value !== null) {
                      handleInputBlur('cityId');
                    }
                  }}
                  setItems={setCities}
                  placeholder="Şehir seçin"
                  style={styles.pickerStyle}
                  textStyle={styles.pickerTextStyle}
                  dropDownContainerStyle={styles.pickerContainerStyle}
                  disabledItemContainerStyle={styles.disabledItemContainerStyle}
                  disabledItemLabelStyle={styles.disabledItemLabelStyle}
                  onClose={() => handleInputBlur('cityId')}
                />
              )}
              {formErrors.cityId && touched.cityId && (
                <Text style={styles.errorText}>{formErrors.cityId}</Text>
              )}
            </View>

            <View style={styles.inputContainer}>
              <Text style={[styles.label, { color: '#222' }]}>
                Kategori seç{' '}
                <Text style={{ color: '#66666660', fontSize: 12 }}>
                  (opsiyonel)
                </Text>
              </Text>

              {isLoadingCategory && (
                <ActivityIndicator size="small" color="#000" />
              )}
              {!isLoadingCategory && (
                <DropDownPicker
                  open={openCategory}
                  value={selectedCategoryId}
                  items={categories}
                  setOpen={setOpenCategory}
                  setValue={setSelectedCategoryId}
                  searchable
                  onChangeValue={value => {
                    if (value !== null) {
                      handleInputBlur('categoryId');
                    }
                  }}
                  setItems={setCategories}
                  placeholder="Kategori seçin"
                  style={styles.pickerStyle}
                  textStyle={styles.pickerTextStyle}
                  dropDownContainerStyle={styles.pickerContainerStyle}
                  disabledItemContainerStyle={styles.disabledItemContainerStyle}
                  disabledItemLabelStyle={styles.disabledItemLabelStyle}
                  onClose={() => handleInputBlur('categoryId')}
                />
              )}
              {formErrors.categoryId && touched.categoryId && (
                <Text style={styles.errorText}>{formErrors.categoryId}</Text>
              )}
            </View>
          </View>

          <ScrollView style={styles.inputContainer}>
            <Text style={styles.sectionTitle}>
              Rota Durakları <Text style={{ color: 'red' }}>*</Text>
            </Text>
            <Text style={{ color: '#666', fontSize: 12, marginBottom: 8 }}>
              {' '}
              (En fazla 10 durak ekleyebilirsiniz)
            </Text>
            {formErrors.routes && touched.routes && (
              <Text style={styles.errorText}>{formErrors.routes}</Text>
            )}

            {routePoints.length > 0 && routePoints.map((point, index) => (
              <View key={point.client_id} style={styles.routeItem}>
                <View style={styles.routeHeader}>
                  <Text style={styles.routeHeaderText}>Durak {index + 1}</Text>
                  <Text style={styles.routeHeaderText}>
                    {index === 0 && '(Ana Durak)'}
                  </Text>
                  <View style={styles.routeActions}>
                    {index > 0 && (
                      <TouchableOpacity
                        style={styles.actionButton}
                        onPress={() => moveRoutePoint(index, index - 1)}>
                        <Text style={styles.actionButtonText}>↑</Text>
                      </TouchableOpacity>
                    )}
                    {index < routePoints.length - 1 && (
                      <TouchableOpacity
                        style={styles.actionButton}
                        onPress={() => moveRoutePoint(index, index + 1)}>
                        <Text style={styles.actionButtonText}>↓</Text>
                      </TouchableOpacity>
                    )}
                    <TouchableOpacity
                      style={[styles.actionButton, styles.removeButton]}
                      onPress={() => removeRoutePoint(point.client_id!)}>
                      <Text style={styles.removeButtonText}>✕</Text>
                    </TouchableOpacity>
                  </View>
                </View>

                <TouchableOpacity
                  style={styles.imagePicker}
                  onPress={() => handleImageSelect(point.client_id!)}>
                  {point.image_url ? (
                    <Image
                      source={{ uri: point.image_url }}
                      style={styles.image}
                    />
                  ) : (
                    <View style={styles.row}>
                      <Icon name="image" size={24} color="#888" />
                      <Text style={{ color: '#888' }}>Resim ekle</Text>
                    </View>
                  )}
                </TouchableOpacity>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>
                    Başlık <Text style={{ color: 'red' }}>*</Text>
                  </Text>
                  <TextInput
                    style={styles.input}
                    value={point.title}
                    onChangeText={text =>
                      updateRoutePoint(point.client_id!, 'title', text)
                    }
                    placeholder="Durak başlığı"
                    placeholderTextColor="#999"
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Açıklama</Text>
                  <TextInput
                    style={[styles.input, { height: 80 }]}
                    value={point.description}
                    onChangeText={text =>
                      updateRoutePoint(point.client_id!, 'description', text)
                    }
                    placeholder="Durak açıklaması"
                    placeholderTextColor="#999"
                    multiline
                    numberOfLines={3}
                  />
                </View>
              </View>
            ))}

            {routePoints.length < 10 && (
              <TouchableOpacity
                style={styles.addButton}
                onPress={addRoutePoint}>
                <Text style={styles.addButtonText}>Yeni durak ekle</Text>
              </TouchableOpacity>
            )}
            <View style={{ height: 200 }} />
          </ScrollView>
        </View>
        <View style={{ height: 50 }} />
      </View>

      <View style={{ zIndex: 1000, bottom: 0, position: 'absolute', right: 0 }}>
        <LoadingFloatingAction
          onPress={handleSubmit}
          isDisabled={isPublishing}
          backgroundColor={isPublishing ? '#ccc' : '#121212'}
          iconName={'leaf'}
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  routeListContainer: {
    maxHeight: 500,
  },
  routeItem: {
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#eee',
  },
  routeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  routeHeaderText: {
    fontSize: 16,
    fontWeight: '600',
  },
  routeActions: {
    flexDirection: 'row',
  },
  actionButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  actionButtonText: {
    fontSize: 16,
    color: '#333',
  },
  removeButton: {
    backgroundColor: '#ffeeee',
  },
  removeButtonText: {
    color: '#ff6b6b',
    fontSize: 16,
  },
  imageSelector: {
    height: 150,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    overflow: 'hidden',
  },
  routeImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  placeholderImage: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    color: '#999',
    fontSize: 14,
  },
  inputGroup: {
    marginBottom: 12,
  },
  inputLabel: {
    fontSize: 14,
    marginBottom: 4,
    color: '#666',
  },
  textInput: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 4,
    padding: 8,
    color: '#333',
  },
  textAreaInput: {
    height: 80,
    textAlignVertical: 'top',
  },
  addButton: {
    backgroundColor: '#121212',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  errorText: {
    color: '#ff6b6b',
    fontSize: 12,
    marginTop: 4,
  },
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  inputContainer: {
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    marginBottom: 8,
  },
  input: {
    height: 40,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 4,
    paddingHorizontal: 10,
    color: '#000',
  },
  image: {
    width: '100%',
    height: 150,
    resizeMode: 'cover',
  },
  pickerContainer: {
    width: '100%',
    marginBottom: 10,
    backgroundColor: '#fff',
    borderRadius: 4,
    overflow: 'hidden',
  },
  picker: {
    height: 40,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 4,
    paddingHorizontal: 10,
    color: '#222',
  },
  pickerItem: {
    fontSize: 16,
    color: '#222',
  },
  button: {
    backgroundColor: '#222',
    padding: 12,
    borderRadius: 4,
    alignItems: 'center',
    marginTop: 16,
  },
  buttonSecondary: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#222',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  row: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    columnGap: 8,
  },
  column: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    columnGap: 16,
  },
  form: {
    padding: 16,
  },
  dropdown: {
    height: 40,
    borderColor: '#ddd',
    borderRadius: 4,
    paddingHorizontal: 8,
    marginBottom: 10,
  },
  iconContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  iconButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  selectedIcon: {
    backgroundColor: '#cc0000',
  },
  colorContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  colorButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedColor: {
    borderColor: '#cc0000',
  },
  submitButton: {
    backgroundColor: '#121212',
    padding: 16,
    width: '50%',
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  dropdownButtonStyle: {
    width: 200,
    height: 50,
    backgroundColor: '#E9ECEF',
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 12,
  },
  dropdownButtonTxtStyle: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
    color: '#151E26',
  },
  dropdownButtonArrowStyle: {
    fontSize: 28,
  },
  dropdownButtonIconStyle: {
    fontSize: 28,
    marginRight: 8,
  },
  dropdownMenuStyle: {
    backgroundColor: '#E9ECEF',
    borderRadius: 8,
  },
  dropdownItemStyle: {
    width: '100%',
    flexDirection: 'row',
    paddingHorizontal: 12,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 8,
  },
  dropdownItemTxtStyle: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
    color: '#151E26',
  },
  dropdownItemIconStyle: {
    fontSize: 28,
    marginRight: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  imagePicker: {
    padding: 16,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    marginBottom: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fafafa',
  },
  pickerStyle: {
    minWidth: '48%',
    borderColor: '#ddd',
    backgroundColor: '#fff',
  },
  pickerTextStyle: {
    color: '#000',
  },
  pickerContainerStyle: {
    borderColor: '#ddd',
    backgroundColor: '#fff',
  },
  disabledItemContainerStyle: {
    opacity: 0.5,
  },
  disabledItemLabelStyle: {
    color: '#666',
  },
});
