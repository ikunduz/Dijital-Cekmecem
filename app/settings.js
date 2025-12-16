import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Image } from 'react-native';
import { TextInput, Button, Icon } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useHomeContext } from '../context/HomeContext';
import * as ImagePicker from 'expo-image-picker';

const COLORS = {
    primary: "#F57C00",
    background: "#E5E7EB",
    textDark: "#111417",
    textGray: "#647487",
    white: "#FFFFFF",
    border: "#e5e7eb",
};

// Theme Colors for Profile
const THEME_COLORS = [
    { id: 'blue', color: '#1d72d3', name: 'Mavi' },
    { id: 'teal', color: '#0d9488', name: 'Turkuaz' },
    { id: 'orange', color: '#F57C00', name: 'Turuncu' },
    { id: 'slate', color: '#475569', name: 'Koyu Gri' },
];

export default function Settings() {
    const router = useRouter();
    const { homeProfile, updateHomeProfile } = useHomeContext();

    const [ownerName, setOwnerName] = useState('');
    const [title, setTitle] = useState('');
    const [address, setAddress] = useState('');
    const [daskNumber, setDaskNumber] = useState('');
    const [internetNumber, setInternetNumber] = useState('');
    const [homeImage, setHomeImage] = useState(null);
    const [themeColor, setThemeColor] = useState('orange');
    const [loading, setLoading] = useState(false);

    // Initialize form with existing data
    useEffect(() => {
        if (homeProfile) {
            setOwnerName(homeProfile.ownerName || '');
            setTitle(homeProfile.title || '');
            setAddress(homeProfile.address || '');
            setDaskNumber(homeProfile.daskNumber || '');
            setInternetNumber(homeProfile.internetNumber || '');
            setHomeImage(homeProfile.homeImage || null);
            setThemeColor(homeProfile.themeColor || 'orange');
        }
    }, [homeProfile]);

    // Pick home photo from gallery
    const pickHomeImage = async () => {
        try {
            let result = await ImagePicker.launchImageLibraryAsync({
                allowsEditing: true,
                aspect: [16, 9],
                quality: 0.7,
            });

            if (!result.canceled) {
                const uri = result.assets[0].uri;
                setHomeImage(uri);
                // Auto-save to profile
                await updateHomeProfile({ homeImage: uri });
            }
        } catch (error) {
            console.error('Pick home image error:', error);
            Alert.alert("Hata", "Fotoğraf seçilirken bir hata oluştu.");
        }
    };

    const handleSave = async () => {
        if (!title) {
            Alert.alert('Eksik Bilgi', 'Lütfen en az "Ev Başlığı" giriniz.');
            return;
        }

        setLoading(true);
        try {
            await updateHomeProfile({
                ownerName,
                title,
                address,
                daskNumber,
                internetNumber
            });
            Alert.alert('Başarılı', 'Ev ve profil bilgileri güncellendi.', [
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

                {/* PROFIL / EV FOTOĞRAFI */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Ev Fotoğrafı</Text>
                    <TouchableOpacity style={styles.imageContainer} onPress={pickHomeImage}>
                        {homeImage ? (
                            <Image source={{ uri: homeImage }} style={styles.homeImage} resizeMode="cover" />
                        ) : (
                            <View style={styles.imagePlaceholder}>
                                <Icon source="home-plus" size={40} color={COLORS.textGray} />
                                <Text style={styles.placeholderText}>Fotoğraf Ekle</Text>
                            </View>
                        )}
                        <View style={styles.overlayIcon}>
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
                                    await updateHomeProfile({ themeColor: theme.id });
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
                    <Text style={styles.sectionTitle}>Ev Bilgileri</Text>
                    <TextInput
                        label="Ev Başlığı (Örn: Yazlık)"
                        value={title}
                        onChangeText={setTitle}
                        mode="outlined"
                        style={styles.input}
                        outlineColor={COLORS.border}
                        activeOutlineColor={COLORS.primary}
                    />
                    <TextInput
                        label="Kullanıcı Adı / Ev Sahibi"
                        value={ownerName}
                        onChangeText={setOwnerName}
                        mode="outlined"
                        style={styles.input}
                        outlineColor={COLORS.border}
                        activeOutlineColor={COLORS.primary}
                    />
                    <TextInput
                        label="Açık Adres"
                        value={address}
                        onChangeText={setAddress}
                        mode="outlined"
                        multiline
                        numberOfLines={3}
                        style={[styles.input, { minHeight: 80 }]}
                        outlineColor={COLORS.border}
                        activeOutlineColor={COLORS.primary}
                    />
                    <TextInput
                        label="DASK Poliçe No"
                        value={daskNumber}
                        onChangeText={setDaskNumber}
                        mode="outlined"
                        style={styles.input}
                        outlineColor={COLORS.border}
                        activeOutlineColor={COLORS.primary}
                    />
                    <TextInput
                        label="İnternet Abone No"
                        value={internetNumber}
                        onChangeText={setInternetNumber}
                        mode="outlined"
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
    // Image Styles
    imageContainer: {
        width: '100%',
        height: 180,
        borderRadius: 12,
        overflow: 'hidden',
        backgroundColor: COLORS.background,
        position: 'relative',
    },
    homeImage: {
        width: '100%',
        height: '100%',
    },
    imagePlaceholder: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderStyle: 'dashed',
        borderColor: COLORS.border,
        borderRadius: 12,
    },
    placeholderText: {
        marginTop: 8,
        fontSize: 14,
        color: COLORS.textGray,
    },
    overlayIcon: {
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
