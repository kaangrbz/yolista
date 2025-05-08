import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ActivityIndicator,
    Image,
    TouchableOpacity,
    ScrollView,
    Alert,
    TextInput,
} from 'react-native';
import { Formik } from 'formik';
import * as Yup from 'yup';
import { Picker } from '@react-native-picker/picker';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { supabase } from '../lib/supabase';
import { useNavigation } from '@react-navigation/native';
import DropDownPicker from 'react-native-dropdown-picker';
import RouteModel from '../model/routes.model';

export const CreateRouteScreen = () => {
    const navigation = useNavigation();

    interface RouteFormValues {
        title: string;
        description: string;
        mainImage: string;
        categoryId: number;
        cityId: number;
    }

    interface City {
        id: number;
        name: string;
    }

    const validationSchema = Yup.object().shape({
        title: Yup.string()
            .required('Rota adı zorunludur')
            .min(2, 'Rota adı en az 2 karakter olmalıdır'),
        description: Yup.string()
            .required('Açıklama zorunludur')
            .min(10, 'Açıklama en az 10 karakter olmalıdır'),
        cityId: Yup.number()
            .required('Şehir seçimi zorunludur'),
    });

    const [cities, setCities] = useState<{ label: string, value: number }[]>([]);
    const [selectedCityId, setSelectedCityId] = useState<number | null>(null);
    const [open, setOpen] = useState(false);
    const [isPublishing, setIsPublishing] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        fetchCities();
    }, []);

    const handleSetSelectedCity = (cityId: number) => {
        setSelectedCityId(cityId);
        setOpen(false);
    };

    const fetchCities = async () => {
        try {
            setIsLoading(true);
            const { data, error } = await supabase
                .from('cities')
                .select('*')
                .order('name');

            if (error) throw error;
            setCities(data.map((city) => ({ label: city.name, value: city.id })));
        } catch (error) {
            console.error('Error fetching cities:', error);
        }
    };

    const handleSubmit = async (values: RouteFormValues) => {
        // Validate required fields
        if (!selectedCityId) {
            Alert.alert('Hata', 'Lütfen şehir seçiniz');
            setIsPublishing(false);
            return;
        }

        console.log('values', values);
        // if (!selectedCategory) {
        //     Alert.alert('Hata', 'Lütfen kategori seçiniz');
        //     setIsPublishing(false);
        //     return;
        // }

        setIsPublishing(true);

        let routeData = {
            title: values.title,
            description: values.description,
            city_id: selectedCityId,
            author_id: (await supabase.auth.getUser())?.data.user?.id,
        };
        
        try {
            const {data, error} = await RouteModel.createRoute(routeData);

            if (error) {
                Alert.alert('Hata', 'Rota eklenirken bir hata oluştu');
                return;
            }

            console.log('routeData', data);

            Alert.alert('Başarılı', 'Rota başarıyla eklendi');
            navigation.goBack();
        } catch (error) {
            console.error('Error adding route:', error);
            Alert.alert('Hata', 'Rota eklenirken bir hata oluştu');
        }
        finally {
            setIsPublishing(false);
        }
    };

    const handleTest = async () => {
        console.log('test');
    };

    return (
        <View style={[styles.container, { backgroundColor: '#fff' }]}>
            <Formik
                initialValues={{
                    title: '',
                    mainImage: '',
                    description: '',
                    cityId: null,
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
                            <Text style={[styles.label, { color: '#222' }]}>
                                Rota Adı
                            </Text>
                            <TextInput
                                style={[
                                    styles.input,
                                    {
                                        color: '#000',
                                        borderColor: '#ddd',
                                    },
                                ]}
                                onChangeText={handleChange('title')}
                                onBlur={handleBlur('title')}
                                value={values.title}
                                placeholder="Rota adını girin"
                                placeholderTextColor={'#999'}
                            />
                            {errors.title && touched.title && (
                                <Text style={styles.errorText}>{errors.title}</Text>
                            )}
                        </View>
                        <View style={styles.inputContainer}>
                            <Text style={[styles.label, { color: '#222' }]}>
                                Açıklama
                            </Text>
                            <TextInput
                                style={[
                                    styles.input,
                                    {
                                        color: '#000',
                                        borderColor: '#ddd',
                                        height: 100,
                                    },
                                ]}
                                multiline
                                numberOfLines={4}
                                onChangeText={handleChange('description')}
                                onBlur={handleBlur('description')}
                                value={values.description}
                                placeholder="Rota açıklamasını girin"
                                placeholderTextColor={'#999'}
                            />
                            {errors.description && touched.description && (
                                <Text style={styles.errorText}>{errors.description}</Text>
                            )}
                        </View>

                        <View style={styles.inputContainer}>
                            <Text style={[styles.label, { color: '#222' }]}>
                                Şehir seç
                            </Text>
                            <View>
                                <DropDownPicker
                                    open={open}
                                    value={selectedCityId}
                                    items={cities}
                                    setOpen={setOpen}

                                    setValue={value => {
                                        setSelectedCityId(value);
                                    }}
                                    onChangeValue={value => {
                                        console.log('onchange => ', value);

                                        setFieldValue('cityId', value);
                                        setSelectedCityId(value);
                                    }}
                                    setItems={setCities}
                                    placeholder="Şehir seçin"
                                    searchable
                                    searchWithRegionalAccents={true}
                                    searchPlaceholder='Şehir ara'

                                />
                            </View>
                            {errors.cityId && touched.cityId && (
                                <Text style={styles.errorText}>{errors.cityId}</Text>
                            )}
                        </View>

                        <View style={styles.column}>
                            <TouchableOpacity
                                style={[styles.submitButton, { opacity: isPublishing ? 0.5 : 1 }]}
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
                                style={[styles.submitButton, { opacity: isPublishing ? 0.5 : 1 }]}
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
}


const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    formContainer: {
        padding: 16,
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
    errorText: {
        color: 'red',
        fontSize: 12,
        marginTop: 4,
    },
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
    }
})
