import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  ScrollView,
} from 'react-native';
import {Formik} from 'formik';
import * as Yup from 'yup';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import KeyboardAwareContainer from '../components/common/KeyboardAwareContainer';
import { useThemedStyles } from '../theme/useThemedStyles';
import { useAppTheme } from '../context/AppThemeContext';

const validationSchema = Yup.object().shape({
  name: Yup.string()
    .min(2, 'Çok kısa!')
    .max(20, 'Çok uzun!')
    .required('Kategori adı gerekli'),
  icon: Yup.string().required('İkon seçimi gerekli'),
  color: Yup.string().required('Renk seçimi gerekli'),
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

export const AddCategoryScreen = ({navigation}: any) => {
  const theme = useAppTheme();
  const styles = useThemedStyles((t) => ({
    container: {
      flex: 1,
      backgroundColor: t.background,
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
      color: t.textPrimary,
    },
    input: {
      borderWidth: 1,
      borderRadius: 8,
      padding: 12,
      fontSize: 16,
      color: t.textPrimary,
      borderColor: t.border,
      backgroundColor: t.surfaceMuted,
    },
    errorText: {
      color: '#dc2626',
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
      backgroundColor: t.surfaceMuted,
    },
    selectedIcon: {
      backgroundColor: '#1DA1F2',
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
      borderColor: '#1DA1F2',
    },
    submitButton: {
      backgroundColor: '#1DA1F2',
      padding: 16,
      borderRadius: 8,
      alignItems: 'center',
      marginTop: 20,
    },
    submitButtonText: {
      color: '#fff',
      fontSize: 16,
      fontWeight: '600',
    },
  }));

  const handleSubmit = (values: any) => {
    navigation.goBack();
  };

  return (
    <KeyboardAwareContainer style={styles.container}>
      <Formik
        initialValues={{name: '', icon: '', color: ''}}
        validationSchema={validationSchema}
        onSubmit={handleSubmit}>
        {({
          handleChange,
          handleBlur,
          handleSubmit,
          values,
          errors,
          touched,
          setFieldValue,
        }) => (
          <View style={styles.form}>
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Kategori Adı</Text>
              <TextInput
                style={styles.input}
                onChangeText={handleChange('name')}
                onBlur={handleBlur('name')}
                value={values.name}
                placeholder="Kategori adını girin"
                placeholderTextColor={theme.textMuted}
              />
              {errors.name && touched.name && (
                <Text style={styles.errorText}>{errors.name}</Text>
              )}
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>İkon</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={styles.iconContainer}>
                  {iconOptions.map(icon => (
                    <TouchableOpacity
                      key={icon}
                      style={[
                        styles.iconButton,
                        values.icon === icon && styles.selectedIcon,
                      ]}
                      onPress={() => setFieldValue('icon', icon)}>
                      <Icon
                        name={icon}
                        size={24}
                        color={values.icon === icon ? '#fff' : theme.textSecondary}
                      />
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>
              {errors.icon && touched.icon && (
                <Text style={styles.errorText}>{errors.icon}</Text>
              )}
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Renk</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={styles.colorContainer}>
                  {colorOptions.map(color => (
                    <TouchableOpacity
                      key={color}
                      style={[
                        styles.colorButton,
                        {
                          backgroundColor: color,
                          opacity: values.color === color ? 1 : 0.8,
                        },
                        values.color === color && styles.selectedColor,
                      ]}
                      onPress={() => setFieldValue('color', color)}
                    />
                  ))}
                </View>
              </ScrollView>
              {errors.color && touched.color && (
                <Text style={styles.errorText}>{errors.color}</Text>
              )}
            </View>

            <TouchableOpacity
              style={styles.submitButton}
              onPress={() => handleSubmit()}>
              <Text style={styles.submitButtonText}>Öneride Bulun</Text>
            </TouchableOpacity>
          </View>
        )}
      </Formik>
    </KeyboardAwareContainer>
  );
};
