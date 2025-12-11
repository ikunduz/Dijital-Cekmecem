import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Image } from 'react-native';
import { TextInput, Button, Icon } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useCarContext } from '../context/CarContext';
import * as ImagePicker from 'expo-image-picker';

const COLORS = {
    primary: "#1d72d3",
    background: "#E5E7EB",
    textDark: "#111417",
    textGray: "#647487",
    white: "#FFFFFF",
    border: "#e5e7eb",
};

export default function AddCar() {
    const router = useRouter();
    const { addNewCar } = useCarContext();

    const [ownerName, setOwnerName] = useState('');
    const [make, setMake] = useState('');
    const [model, setModel] = useState('');
    const [plate, setPlate] = useState('');
    const [year, setYear] = useState('');
    const [carImage, setCarImage] = useState(null);
    const [loading, setLoading] = useState(false);

    const pickCarImage = async () => {
        try {
            let result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                aspect: [16, 9],
                quality: 0.7,
            });

            if (!result.canceled) {
                setCarImage(result.assets[0].uri);
            }
        } catch (error) {
            console.error('Pick car image error:', error);
            Alert.alert("Hata", "Fotoğraf seçilirken bir hata oluştu.");
        }
    };

    const handleSave = async () => {
        if (!make || !model || !plate) {
            Alert.alert('Eksik Bilgi', 'Lütfen en az Marka, Model ve Plaka bilgilerini doldurun.');
            return;
        }

        setLoading(true);
        try {
            await addNewCar({
                ownerName,
                make,
                model,
                plate,
                year,
                carImage,
                themeColor: 'blue' // Default theme
            });
            Alert.alert('Başarılı', 'Yeni araç eklendi!', [
                { text: 'Tamam', onPress: () => router.replace('/') }
            ]);
        } catch (error) {
            console.error(error);
            Alert.alert('Hata', 'Araç eklenirken bir sorun oluştu.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>

            {/* HEADER */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.closeButton}>
                    <Icon source="close" size={24} color={COLORS.textDark} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Yeni Araç Ekle</Text>
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
                    </TouchableOpacity>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Sürücü Bilgileri</Text>
                    <TextInput
                        label="Ad Soyad (Opsiyonel)"
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
                    Araç Ekle
                </Button>

                <View style={{ height: 100 }} />
            </ScrollView>
        </SafeAreaView>
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
    carImageContainer: {
        width: '100%',
        height: 180,
        borderRadius: 12,
        overflow: 'hidden',
        backgroundColor: COLORS.background,
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
});
