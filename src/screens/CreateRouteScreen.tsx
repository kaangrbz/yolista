import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ActivityIndicator,
    Alert,
    TextInput,
    TouchableOpacity,
    Image,
    ScrollView
} from 'react-native';
import { supabase } from '../lib/supabase';
import { useNavigation } from '@react-navigation/native';
import DropDownPicker from 'react-native-dropdown-picker';
import RouteModel from '../model/routes.model';
import { launchImageLibrary, Asset } from 'react-native-image-picker';
import { LoadingFloatingAction } from '../components';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import BookmarkList, { Bookmark } from '../components/BookmarkList';
import { useBookmarkStore } from '../store/bookmarkStore';

export const CreateRouteScreen = () => {
    const navigation = useNavigation();

    interface City {
        id: number;
        name: string;
    }

    interface Bookmark {
        title: string;
        image: string;
        description?: string | null;
        longitude?: number;
        latitude?: number;
    }

    // Form state
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        mainImage: ''
    });
    const [selectedImage, setSelectedImage] = useState<string | null>(null);
    const [formErrors, setFormErrors] = useState({
        title: '',
        description: '',
        cityId: '',
        mainImage: '',
        stops: ''
    });
    const [touched, setTouched] = useState({
        title: false,
        description: false,
        cityId: false,
        mainImage: false,
        stops: false
    });

    const [cities, setCities] = useState<{ label: string, value: number }[]>([]);
    const [selectedCityId, setSelectedCityId] = useState<number | null>(null);
    const [open, setOpen] = useState(false);
    const [isPublishing, setIsPublishing] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    
    // Bookmark state using Zustand store
    const { bookmarks, addBookmark, updateBookmark, removeBookmark, clearBookmarks } = useBookmarkStore();

    useEffect(() => {
        fetchCities();
    }, []);

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
        } finally {
            setIsLoading(false);
        }
    };

    // Validate form fields
    const validateForm = () => {
        const errors = {
            mainImage: '',
            title: '',
            description: '',
            cityId: '',
            stops: ''
        };
        let isValid = true;

        // Main Image validation
        // if (!formData.mainImage) {
        //     errors.mainImage = 'Rota resmi zorunludur';
        //     isValid = false;
        // }

        // Title validation
        if (!formData.title) {
            errors.title = 'Rota adı zorunludur';
            isValid = false;
        } else if (formData.title.length < 2) {
            errors.title = 'Rota adı en az 2 karakter olmalıdır';
            isValid = false;
        }

        // Bookmarks validation
        if (bookmarks.length === 0) {
            errors.stops = 'En az bir durak zorunludur';
            isValid = false;
        } else {
            // Check if all bookmarks have titles
            const incompleteBookmarks = bookmarks.filter(bookmark => !bookmark.title.trim());
            if (incompleteBookmarks.length > 0) {
                errors.stops = 'Tüm durakların adları girilmelidir';
                isValid = false;
            }
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

    // Handle input changes
    const handleInputChange = (field: string, value: string) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }));

        // Mark field as touched
        if (!touched[field as keyof typeof touched]) {
            setTouched(prev => ({
                ...prev,
                [field]: true
            }));
        }
    };

    // Handle input blur
    const handleInputBlur = (field: string) => {
        setTouched(prev => ({
            ...prev,
            [field]: true
        }));
        validateForm();
    };
    
    // Initialize with at least one empty bookmark when the screen loads
    useEffect(() => {
        if (bookmarks.length === 0) {
            addBookmark();
        }
        
        return () => {
            // Clear bookmarks when component unmounts
            clearBookmarks();
        };
    }, []);

    // Handle image selection for a bookmark
    const handleBookmarkImageSelect = async (bookmarkId: string) => {
        try {
            const result = await launchImageLibrary({
                mediaType: 'photo',
                selectionLimit: 1,
                quality: 0.8,
            });
            
            if (!result.didCancel && result.assets && result.assets.length > 0) {
                const asset = result.assets[0];
                if (asset.uri) {
                    // Update the bookmark with the selected image URI
                    updateBookmark(bookmarkId, 'imageUri', asset.uri);
                }
            }
        } catch (error) {
            console.error('Error selecting image:', error);
            Alert.alert('Hata', 'Resim seçilirken bir hata oluştu');
        }
    };

    const handleSubmit = async (): Promise<void> => {
        // Validate form
        const isValid = validateForm();

        // Mark all fields as touched
        setTouched({
            title: true,
            description: true,
            cityId: true,
            mainImage: true,
            stops: true
        });

        if (!isValid) {
            return;
        }

        setIsPublishing(true);

        // Make sure selectedCityId is not null before proceeding
        if (selectedCityId === null) {
            Alert.alert('Hata', 'Lütfen şehir seçiniz');
            setIsPublishing(false);
            return;
        }

        let routeData = {
            title: formData.title,
            description: formData.description,
            city_id: selectedCityId, // Now we're sure it's not null
            author_id: (await supabase.auth.getUser())?.data.user?.id,
            bookmarks: bookmarks.map(bookmark => ({
                title: bookmark.title,
                description: bookmark.description,
                image: bookmark.imageUri
            }))
        };

        try {
            const { data, error } = await RouteModel.createRoute(routeData);

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

    return (
        <><ScrollView style={[styles.container, { backgroundColor: '#fff' }]}>
            <View style={styles.form}>
                <View style={styles.inputContainer}>
                    <Text style={[styles.label, { color: '#222' }]}>
                        Rota Resmi <Text style={{ color: '#666' }}>(Önerilen oran: 2:1)</Text>
                    </Text>
                    <TouchableOpacity
                        style={{
                            height: 200,
                            borderWidth: 1,
                            borderColor: '#ddd',
                            borderRadius: 8,
                            marginBottom: 8,
                            alignItems: 'center',
                            justifyContent: 'center',
                            backgroundColor: '#fafafa',
                        }}
                        onPress={async () => {
                            const result = await launchImageLibrary({
                                mediaType: 'photo',
                                selectionLimit: 1,
                            });
                            const asset = result.assets?.[0];
                            if (!result.didCancel && asset && asset.uri) {
                                setSelectedImage(asset.uri);
                                setFormData(prev => ({ ...prev, mainImage: asset.uri as string }));
                            }
                        }}
                    >
                        {selectedImage ? (
                            <Image
                                source={{ uri: selectedImage }}
                                style={{ width: '100%', height: 200, borderRadius: 8 }}
                                resizeMode="contain"
                            />
                        ) : (
                            <Text style={{ color: '#888' }}>Galeriden resim seç</Text>
                        )}
                    </TouchableOpacity>
                    {formErrors.mainImage && touched.mainImage && (
                        <Text style={styles.errorText}>{formErrors.mainImage}</Text>
                    )}
                </View>
                <View style={styles.inputContainer}>
                    <Text style={[styles.label, { color: '#222' }]}>
                        Rota Adı <Text style={{ color: 'red' }}>*</Text>
                    </Text>
                    <TextInput
                        style={styles.input}
                        onChangeText={(text) => handleInputChange('title', text)}
                        onBlur={() => handleInputBlur('title')}
                        value={formData.title}
                        placeholder="Rota adını girin"
                        placeholderTextColor={'#999'}
                    />
                    {formErrors.title && touched.title && (
                        <Text style={styles.errorText}>{formErrors.title}</Text>
                    )}
                </View>
                <View style={styles.inputContainer}>
                    <Text style={[styles.label, { color: '#222' }]}>
                        Açıklama
                    </Text>
                    <TextInput
                        style={[styles.input, { height: 100 }]}
                        multiline
                        numberOfLines={4}
                        onChangeText={(text) => handleInputChange('description', text)}
                        onBlur={() => handleInputBlur('description')}
                        value={formData.description}
                        placeholder="Rota açıklamasını girin"
                        placeholderTextColor={'#999'}
                    />
                    {formErrors.description && touched.description && (
                        <Text style={styles.errorText}>{formErrors.description}</Text>
                    )}
                </View>

                <View style={styles.inputContainer}>
                    <Text style={[styles.label, { color: '#222' }]}>
                        Şehir seç <Text style={{ color: 'red' }}>*</Text>
                    </Text>
                    <DropDownPicker
                        open={open}
                        value={selectedCityId}
                        items={cities}
                        setOpen={setOpen}
                        setValue={setSelectedCityId}
                        searchable
                        onChangeValue={(value) => {
                            if (value !== null) {
                                handleInputBlur('cityId');
                            }
                        }}
                        setItems={setCities}
                        placeholder="Şehir seçin"
                        style={{
                            borderColor: '#ddd',
                            backgroundColor: '#fff',
                        }}
                        textStyle={{
                            color: '#000',
                        }}
                        dropDownContainerStyle={{
                            borderColor: '#ddd',
                            backgroundColor: '#fff',
                        }}
                        zIndex={1000}
                        onClose={() => handleInputBlur('cityId')}
                    />
                    {formErrors.cityId && touched.cityId && (
                        <Text style={styles.errorText}>{formErrors.cityId}</Text>
                    )}
                </View>

                <View style={styles.inputContainer}>
                    
                    <BookmarkList
                        bookmarks={bookmarks}
                        onAddBookmark={() => {
                            if (bookmarks.length < 10) {
                                addBookmark();
                            } else {
                                Alert.alert('Uyarı', 'En fazla 10 durak ekleyebilirsiniz.');
                            }
                        }}
                        onUpdateBookmark={updateBookmark}
                        onImageSelect={handleBookmarkImageSelect}
                        onRemoveBookmark={(id: string) => {
                            // Prevent removing the last bookmark
                            if (bookmarks.length > 1) {
                                removeBookmark(id);
                            } else {
                                Alert.alert('Uyarı', 'En az bir durak olmalıdır.');
                            }
                        }}
                        error={formErrors.stops && touched.stops ? formErrors.stops : undefined}
                    />
                </View>

            </View>
{/* 
            <View style={{ height: 80 }} /> */}


        </ScrollView>

            <View style={{ zIndex: 1000, bottom: 0, position: 'absolute', right: 0 }}>
                <LoadingFloatingAction
                    onPress={handleSubmit}
                    isDisabled={isPublishing}
                    backgroundColor={isPublishing ? '#ccc' : '#121212'}
                    iconName={"leaf"} />
            </View></>
    );
}

const styles = StyleSheet.create({
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
