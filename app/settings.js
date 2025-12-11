import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Image } from 'react-native';
import { TextInput, Button, Icon } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useCarContext } from '../context/CarContext';
import * as ImagePicker from 'expo-image-picker';

const COLORS = {
    primary: "#1d72d3",
    background: "#f8f9fa",
    textDark: "#111417",
    textGray: "#647487",
    white: "#FFFFFF",
    border: "#e5e7eb",
};

// Theme Colors for Profile
const THEME_COLORS = [
    { id: 'blue', color: '#1d72d3', name: 'Mavi' },
    { id: 'teal', color: '#0d9488', name: 'Turkuaz' },
    { id: 'orange', color: '#ea580c', name: 'Turuncu' },
    { id: 'slate', color: '#475569', name: 'Koyu Gri' },
];

export default function Settings() {
    const router = useRouter();
    const { carProfile, updateCarProfile } = useCarContext();

    const [ownerName, setOwnerName] = useState('');
    const [make, setMake] = useState('');
    const [model, setModel] = useState('');
    const [plate, setPlate] = useState('');
    const [year, setYear] = useState('');
    const [carImage, setCarImage] = useState(null);
    const [themeColor, setThemeColor] = useState('blue');
    const [loading, setLoading] = useState(false);

    // Initialize form with existing data
    useEffect(() => {
        if (carProfile) {
            setOwnerName(carProfile.ownerName || '');
            setMake(carProfile.make || '');
            setModel(carProfile.model || '');
            setPlate(carProfile.plate || '');
            setYear(carProfile.year || '');
            setCarImage(carProfile.carImage || null);
            setThemeColor(carProfile.themeColor || 'blue');
        }
    }, [carProfile]);

    // Pick car photo from gallery
    const pickCarImage = async () => {
        try {
            let result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                aspect: [16, 9],
                quality: 0.7,
            });

            if (!result.canceled) {
                const uri = result.assets[0].uri;
                setCarImage(uri);
                // Auto-save to profile
                await updateCarProfile({ carImage: uri });
            }
        } catch (error) {
            console.error('Pick car image error:', error);
            Alert.alert("Hata", "Fotoğraf seçilirken bir hata oluştu.");
        }
    };

    const handleSave = async () => {
        if (!ownerName || !make || !model || !plate) {
            Alert.alert('Eksik Bilgi', 'Lütfen en az Ad Soyad, Marka, Model ve Plaka bilgilerini doldurun.');
            return;
        }

        setLoading(true);
        try {
            await updateCarProfile({
                ownerName,
                make,
                model,
                plate,
                year
            });
            Alert.alert('Başarılı', 'Araç ve profil bilgileri güncellendi.', [
                { text: 'Tamam', onPress: () => router.back() }
            ]);
        } catch (error) {
            console.error(error);
            Alert.alert('Hata', 'Kaydedilirken bir sorun oluştu.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
            {/* HEADER */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.closeButton}>
                    <Icon source="arrow-left" size={24} color={COLORS.textDark} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Ayarlar</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView contentContainerStyle={styles.content}>

                {/* ARAÇ FOTOĞRAFI */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Araç Fotoğrafı</Text>
                    <TouchableOpacity style={styles.carImageContainer} onPress={pickCarImage}>
                        {carImage ? (
                            <Image source={{ uri: carImage }} style={styles.carImage} resizeMode="cover" />
                        ) : (
                            <View style={styles.carImagePlaceholder}>
                                <Icon source="camera-plus" size={40} color={COLORS.textGray} />
                                <Text style={styles.carImagePlaceholderText}>Araç Fotoğrafı Ekle</Text>
                            </View>
                        )}
                        <View style={styles.carImageOverlay}>
                            <Icon source="pencil" size={20} color={COLORS.white} />
                        </View>
                    </TouchableOpacity>
                </View>

                {/* TEMA RENGİ */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Tema Rengi</Text>
                    <View style={styles.colorPickerRow}>
                        {THEME_COLORS.map((theme) => (
                            <TouchableOpacity
                                key={theme.id}
                                style={[
                                    styles.colorOption,
                                    { backgroundColor: theme.color },
                                    themeColor === theme.id && styles.colorOptionSelected
                                ]}
                                onPress={async () => {
                                    setThemeColor(theme.id);
                                    await updateCarProfile({ themeColor: theme.id });
                                }}
                            >
                                {themeColor === theme.id && (
                                    <Icon source="check" size={20} color={COLORS.white} />
                                )}
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Sürücü Bilgileri</Text>
                    <TextInput
                        label="Ad Soyad"
                        value={ownerName}
                        onChangeText={setOwnerName}
                        mode="outlined"
                        style={styles.input}
                        outlineColor={COLORS.border}
                        activeOutlineColor={COLORS.primary}
                    />
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Araç Bilgileri</Text>
                    <TextInput
                        label="Marka (Örn: Volkswagen)"
                        value={make}
                        onChangeText={setMake}
                        mode="outlined"
                        style={styles.input}
                        outlineColor={COLORS.border}
                        activeOutlineColor={COLORS.primary}
                    />
                    <TextInput
                        label="Model (Örn: Golf)"
                        value={model}
                        onChangeText={setModel}
                        mode="outlined"
                        style={styles.input}
                        outlineColor={COLORS.border}
                        activeOutlineColor={COLORS.primary}
                    />
                    <TextInput
                        label="Plaka (Örn: 34 ABC 123)"
                        value={plate}
                        onChangeText={setPlate}
                        mode="outlined"
                        autoCapitalize="characters"
                        style={styles.input}
                        outlineColor={COLORS.border}
                        activeOutlineColor={COLORS.primary}
                    />
                    <TextInput
                        label="Model Yılı (Opsiyonel)"
                        value={year}
                        onChangeText={setYear}
                        mode="outlined"
                        keyboardType="numeric"
                        maxLength={4}
                        style={styles.input}
                        outlineColor={COLORS.border}
                        activeOutlineColor={COLORS.primary}
                    />
                </View>

                <Button
                    mode="contained"
                    onPress={handleSave}
                    style={styles.saveButton}
                    contentStyle={{ height: 50 }}
                    loading={loading}
                    disabled={loading}
                    buttonColor={COLORS.primary}
                >
                    Kaydet
                </Button>

                {/* Spacer for scrollability */}
                <View style={{ height: 100 }} />

            </ScrollView>
        </SafeAreaView >
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.white,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: COLORS.textDark,
    },
    closeButton: {
        padding: 8,
        marginLeft: -8,
    },
    content: {
        padding: 24,
        paddingBottom: 120,
    },
    section: {
        marginBottom: 32,
        gap: 16,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: COLORS.textGray,
        marginBottom: 8,
    },
    input: {
        backgroundColor: COLORS.white,
    },
    saveButton: {
        borderRadius: 8,
        marginTop: 16,
    },
    // Car Image Styles
    carImageContainer: {
        width: '100%',
        height: 180,
        borderRadius: 12,
        overflow: 'hidden',
        backgroundColor: COLORS.background,
        position: 'relative',
    },
    carImage: {
        width: '100%',
        height: '100%',
    },
    carImagePlaceholder: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderStyle: 'dashed',
        borderColor: COLORS.border,
        borderRadius: 12,
    },
    carImagePlaceholderText: {
        marginTop: 8,
        fontSize: 14,
        color: COLORS.textGray,
    },
    carImageOverlay: {
        position: 'absolute',
        bottom: 12,
        right: 12,
        backgroundColor: COLORS.primary,
        borderRadius: 20,
        padding: 8,
    },
    // Color Picker
    colorPickerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: 12,
    },
    colorOption: {
        flex: 1,
        height: 56,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    colorOptionSelected: {
        borderWidth: 3,
        borderColor: COLORS.white,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 5,
    },
});
