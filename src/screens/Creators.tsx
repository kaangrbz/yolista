import { Text, View, ScrollView, StyleSheet, Image } from 'react-native';
import ImgOfMe from '../assets/images/creators/img_of_me.png';

const Creators = () => {
    return (
        <ScrollView style={styles.container}>
            <View style={styles.header}>
                <View style={styles.profileImageContainer}>
                    <Image
                        source={ImgOfMe}
                        style={styles.profileImage}
                        resizeMode="cover"
                    />
                </View>
                <Text style={styles.name}>Abdi Kaan GÜRBÜZ</Text>
            </View>

            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Kişisel Bilgiler</Text>
                <View style={styles.infoRow}>
                    <Text style={styles.label}>Bölüm:</Text>
                    <Text style={styles.value}>Bilgisayar Programcılığı (İ.Ö.)</Text>
                </View>
                <View style={styles.infoRow}>
                    <Text style={styles.label}>Okul Numarası:</Text>
                    <Text style={styles.value}>2021730030</Text>
                </View>
                <View style={styles.infoRow}>
                    <Text style={styles.label}>Email:</Text>
                    <Text style={styles.value}>abdikaangrbz@gmail.com</Text>
                </View>
            </View>

            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Hakkımda</Text>
                <Text style={styles.aboutText}>
                    Ben Abdi Kaan Gürbüz, bu rota planlama projesi tek kişilik bir projedir.
                    Kullanıcılara gezdikleri yerleri paylaşabilme veyahut gezmek istedikleri yerleri keşfetmelerini sağlar.
                </Text>

                <Text style={[styles.aboutText, {marginTop: 10}]}>
                Uygulama tasarımı, fikri, arayüz tasarımı, api ve veritabanı işlemleri tamamen bana aittir.
                </Text>
            </View>

            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Kullanılan teknolojiler ve bazı paketler</Text>
                <View style={styles.skillsContainer}>
                    <Text style={styles.skill}>React Native</Text>
                    <Text style={styles.skill}>TypeScript</Text>
                    <Text style={styles.skill}>Supabase Database, Storage, Auth</Text>
                    <Text style={styles.skill}>Git</Text>
                    <Text style={styles.skill}>RN Async Storage</Text>
                    <Text style={styles.skill}>React Navigation</Text>
                    <Text style={styles.skill}>Zustand</Text>
                    <Text style={styles.skill}>RN Vector Icons</Text>
                </View>
            </View>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
        padding: 20,
    },
    header: {
        alignItems: 'center',
        marginBottom: 30,
        paddingTop: 20,
    },
    profileImageContainer: {
        width: 150,
        height: 150,
        borderRadius: 75,
        overflow: 'hidden',
        marginBottom: 15,
        borderWidth: 3,
        borderColor: '#007AFF',
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 4,
        },
        shadowOpacity: 0.3,
        shadowRadius: 4.65,
        elevation: 8,
    },
    profileImage: {
        width: '100%',
        height: '100%',
    },
    name: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 5,
    },
    title: {
        fontSize: 18,
        color: '#666',
        fontStyle: 'italic',
    },
    section: {
        backgroundColor: 'white',
        padding: 20,
        marginBottom: 15,
        borderRadius: 10,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 3.84,
        elevation: 5,
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 15,
        borderBottomWidth: 2,
        borderBottomColor: '#007AFF',
        paddingBottom: 5,
    },
    infoRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 10,
        paddingVertical: 5,
    },
    label: {

        fontSize: 16,
        fontWeight: '600',
        color: '#555',
        flex: 1,
    },
    value: {
        fontSize: 16,
        color: '#333',
        flex: 2,
        textAlign: 'right',
    },
    aboutText: {
        fontSize: 16,
        lineHeight: 24,
        color: '#444',
    },
    educationItem: {
        marginBottom: 15,
    },
    degree: {
        fontSize: 18,
        fontWeight: '600',
        color: '#333',
        marginBottom: 5,
    },
    school: {
        fontSize: 16,
        color: '#666',
        marginBottom: 3,
    },
    year: {
        fontSize: 14,
        color: '#888',
        fontStyle: 'italic',
    },
    skillsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10,
    },
    skill: {
        backgroundColor: '#007AFF',
        color: 'white',
        paddingHorizontal: 15,
        paddingVertical: 8,
        borderRadius: 20,
        fontSize: 14,
        fontWeight: '500',
    },
    experienceItem: {
        marginBottom: 15,
    },
    jobTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#333',
        marginBottom: 5,
    },
    company: {
        fontSize: 16,
        color: '#666',
        marginBottom: 3,
    },
    description: {
        fontSize: 14,
        lineHeight: 20,
        color: '#555',
        marginTop: 8,
    },
});

export default Creators;
