import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  useColorScheme,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import {Formik} from 'formik';
import * as Yup from 'yup';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {supabase} from '../lib/supabase';
import DropDownPicker from 'react-native-dropdown-picker';

const validationSchema = Yup.object().shape({
  title: Yup.string()
    .required('Rota adı zorunludur')
    .min(2, 'Rota adı en az 2 karakter olmalıdır'),
  mainImage: Yup.string().required('Ana resim zorunludur'),
  description: Yup.string().required('Açıklama zorunludur'),
  categoryId: Yup.number().required('Kategori seçimi zorunludur'),
  cityId: Yup.number().required('Şehir seçimi zorunludur'),
});

const iconOptions = [
  'city',
  'tree',
  'castle',
  'beach',
  'mountain',
  'food',
  'shopping',
  'museum',
  'park',
  'restaurant',
];

const colorOptions = [
  '#FF6B6B',
  '#4ECDC4',
  '#45B7D1',
  '#96CEB4',
  '#FFEEAD',
  '#D4A5A5',
  '#9B59B6',
  '#3498DB',
  '#E67E22',
  '#1ABC9C',
];

export type Route = {
  id: string; // UUID for the route
  parent_id: string | null; // Points to the parent route (NULL for main routes)
  title: string; // Title of the route
  description: string | null; // Description of the route
  image_url: string | null; // Main image URL for the route or bookmark
  author_id: string | null; // UUID of the author (user or profile)
  city_id: number | null; // City ID (relevant for main routes)
  order_index: number | null; // Relevant for bookmarks (to order them under a parent route)
  is_deleted: boolean; // Flag for soft delete
  created_at: string; // Timestamp of creation (ISO 8601 string)
  updated_at: string; // Timestamp of last update (ISO 8601 string)
};

export const CreateRouteScreen = ({navigation}: any) => {
  const isDarkMode = useColorScheme() === 'dark';
  const [cities, setCities] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [selectedCityId, setSelectedCityId] = useState<number | null>(38);
  const [selectedCategory, setSelectedCategory] = useState<number | null>(35);
  const [categoryOpen, setCategoryOpen] = useState(false);
  const [cityOpen, setCityOpen] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);

  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchCities();
    fetchCategories();
  }, []);

  const fetchCities = async () => {
    try {
      setIsLoading(true);
      const {data, error} = await supabase
        .from('cities')
        .select('*')
        .order('name');

      if (error) throw error;
      setCities(data.map(city => ({label: city.name, value: city.id})));
    } catch (error) {
      console.error('Error fetching cities:', error);
      Alert.alert('Hata', 'Şehirler yüklenirken bir hata oluştu');
    } finally {
      setIsLoading(false);
    }
  };
  // Add this function
  const fetchCategories = async () => {
    try {
      const {data, error} = await supabase
        .from('categories')
        .select('*')
        .order('index', {ascending: true});

      if (error) throw error;
      setCategories(
        data.map(category => ({label: category.name, value: category.id})),
      );
    } catch (error) {
      console.error('Error fetching categories:', error);
      Alert.alert('Hata', 'Kategoriler yüklenirken bir hata oluştu');
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Şehirler yükleniyor...</Text>
      </View>
    );
  }

  const handleAddBookmark = async (values: any) => {
    try {
      setIsPublishing(true);
      const {data, error} = await supabase.from('bookmarks').insert({
        title: values.title,
        description: values.description,
        order_index: 0,
        route_id: null,
        author_id: null,
        city_id: selectedCityId,
      });

      if (error) throw error;
      console.log('Bookmark added:', data);
    } catch (error) {
      console.error('Error adding bookmark:', error);
      Alert.alert('Hata', 'Yer eklenirken bir hata oluştu');
    } finally {
      setIsPublishing(false);
    }
  };

  const handleSubmit = async (values: any) => {
    // TODO: Save category to storage/state
    setIsPublishing(true);

    const {data, error} = await supabase
      .from('routes')
      .insert([
        {
          title: values.title,
          description: values.description,
          city_id: selectedCityId,
          category_id: selectedCategory,
          author_id: (await supabase.auth.getUser())?.data.user?.id,
        },
      ])
      .select();

    if (error) {
      console.error('Error adding route:', error);
      Alert.alert('Hata', 'Rota eklenirken bir hata oluştu');
      setIsPublishing(false);
      return;
    }
    console.log('Route added:', data);
    Alert.alert('Başarılı', 'Rota başarıyla eklendi');
    setIsPublishing(false);
    navigation.goBack();

    console.log(
      'Form values:',
      values,
      values.cityId,
      selectedCityId,
      selectedCategory,
    );
  };

  return (
    <View
      style={[
        styles.container,
        {backgroundColor: isDarkMode ? '#000' : '#fff'},
      ]}>
      <Formik
        initialValues={{
          title: 'Deneme',
          mainImage: 'https://picsum.photos/400/200',
          description: 'Deneme aciklama',
          categoryId: 33,
          cityId: 38,
        }}
        validationSchema={validationSchema}
        onSubmit={handleSubmit}>
        {({
          handleChange,
          handleBlur,
          handleSubmit,
          setFieldValue,
          values,
          errors,
          touched,
        }) => (
          <View style={styles.form}>
            <View style={styles.inputContainer}>
              <Text
                style={[styles.label, {color: isDarkMode ? '#fff' : '#222'}]}>
                Rota Adı
              </Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    color: isDarkMode ? '#fff' : '#000',
                    borderColor: isDarkMode ? '#333' : '#ddd',
                  },
                ]}
                onChangeText={handleChange('title')}
                onBlur={handleBlur('title')}
                value={values.title}
                placeholder="Rota adını girin"
                placeholderTextColor={isDarkMode ? '#666' : '#999'}
              />
              {errors.title && touched.title && (
                <Text style={styles.errorText}>{errors.title}</Text>
              )}
            </View>
            <View style={styles.inputContainer}>
              <Text
                style={[styles.label, {color: isDarkMode ? '#fff' : '#222'}]}>
                Açıklama
              </Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    color: isDarkMode ? '#fff' : '#000',
                    borderColor: isDarkMode ? '#333' : '#ddd',
                    height: 100,
                  },
                ]}
                multiline
                numberOfLines={4}
                onChangeText={handleChange('description')}
                onBlur={handleBlur('description')}
                value={values.description}
                placeholder="Rota açıklamasını girin"
                placeholderTextColor={isDarkMode ? '#666' : '#999'}
              />
              {errors.description && touched.description && (
                <Text style={styles.errorText}>{errors.description}</Text>
              )}
            </View>

            <View style={styles.inputContainer}>
              <Text
                style={[styles.label, {color: isDarkMode ? '#fff' : '#222'}]}>
                Kategori seç
              </Text>
              <DropDownPicker
                open={categoryOpen}
                value={selectedCategory}
                items={categories}
                setOpen={setCategoryOpen}
                setValue={value => {
                  setSelectedCategory(value);
                }}
                onChangeValue={value => {
                  console.log('onchange => ', value);

                  setFieldValue('categoryId', value);
                  setSelectedCategory(value);
                }}
                setItems={setCategories}
                searchable={true}
                placeholder="Kategori arayın"
                searchPlaceholder="Kategori arayın"
              />
              {errors.categoryId && touched.categoryId && (
                <Text style={styles.errorText}>{errors.categoryId}</Text>
              )}
            </View>
            <View style={styles.inputContainer}>
              <Text
                style={[styles.label, {color: isDarkMode ? '#fff' : '#222'}]}>
                Şehir seç
              </Text>
              <DropDownPicker
                open={cityOpen}
                value={selectedCityId}
                items={cities}
                setOpen={setCityOpen}
                setValue={value => {
                  setSelectedCityId(value);
                }}
                onChangeValue={value => {
                  console.log('onchange => ', value);

                  setFieldValue('cityId', value);
                  setSelectedCityId(value);
                }}
                setItems={setCities}
                searchable={true}
                placeholder="Şehir arayın"
                searchPlaceholder="Şehir arayın"
              />
              {errors.cityId && touched.cityId && (
                <Text style={styles.errorText}>{errors.cityId}</Text>
              )}
            </View>

            <View style={styles.column}>
              <TouchableOpacity
                style={[styles.submitButton, {opacity: isPublishing ? 0.5 : 1}]}
                onPress={() => handleAddBookmark(values)}
                disabled={isPublishing}>
                {isPublishing ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <>
                    <Text style={styles.submitButtonText}>Yer Ekle</Text>
                    <Icon name="plus" size={20} color="#fff" />
                  </>
                )}
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.submitButton, {opacity: isPublishing ? 0.5 : 1}]}
                onPress={() => handleSubmit()}
                disabled={isPublishing}>
                {isPublishing ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <>
                    <Text style={styles.submitButtonText}>Rotanı Paylaş</Text>
                    <Icon name="share" size={20} color="#fff" />
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        )}
      </Formik>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  row: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
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
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  errorText: {
    color: '#cc0000',
    fontSize: 12,
    marginTop: 4,
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
});
