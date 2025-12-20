import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Image } from 'react-native';
import { TextInput, Button, Icon } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useHomeContext } from '../context/HomeContext';
import * as ImagePicker from 'expo-image-picker';

const COLORS = {
    primary: "#F57C00", // Home Warmth Orange
    background: "#E5E7EB",
    textDark: "#111417",
    textGray: "#647487",
    white: "#FFFFFF",
    border: "#e5e7eb",
};

export default function AddHome() {
    const router = useRouter();
    const { addNewHome } = useHomeContext();

    const [ownerName, setOwnerName] = useState('');
    const [title, setTitle] = useState(''); // e.g. "Evim", "Yazlık"
    const [address, setAddress] = useState('');
    const [daskNumber, setDaskNumber] = useState('');
    const [internetNumber, setInternetNumber] = useState('');
    const [homeImage, setHomeImage] = useState(null);
    const [loading, setLoading] = useState(false);

    const pickHomeImage = async () => {
        try {
            let result = await ImagePicker.launchImageLibraryAsync({
                allowsEditing: true,
                aspect: [16, 9],
                quality: 0.7,
            });

            if (!result.canceled) {
                setHomeImage(result.assets[0].uri);
            }
        } catch (error) {
            console.error('Pick home image error:', error);
            Alert.alert("Hata", "Fotoğraf seçilirken bir hata oluştu.");
        }
    };

    const handleSave = async () => {
        if (!title) {
            Alert.alert('Eksik Bilgi', 'Lütfen Ev/Mekan Adı giriniz.');
            return;
        }

        setLoading(true);
        try {
            await addNewHome({
                ownerName,
                title,
                address,
                daskNumber,
                internetNumber,
                homeImage,
                themeColor: 'orange' // Default theme
            });
            Alert.alert('Başarılı', 'Yeni ev eklendi!', [
                { text: 'Tamam', onPress: () => router.replace('/') }
            ]);
        } catch (error) {
            console.error(error);
            Alert.alert('Hata', 'Ev eklenirken bir sorun oluştu.');
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
                <Text style={styles.headerTitle}>Yeni Ev Ekle</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView contentContainerStyle={styles.content}>

                {/* EV FOTOĞRAFI */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Ev Fotoğrafı</Text>
                    <TouchableOpacity style={styles.imageContainer} onPress={pickHomeImage}>
                        {homeImage ? (
                            <Image source={{ uri: homeImage }} style={styles.homeImage} resizeMode="cover" />
                        ) : (
                            <View style={styles.imagePlaceholder}>
                                <Icon source="camera-plus" size={40} color={COLORS.textGray} />
                                <Text style={styles.placeholderText}>Ev Fotoğrafı Ekle</Text>
                            </View>
                        )}
                    </TouchableOpacity>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Ev Bilgileri</Text>
                    <TextInput
                        label="Ev Adı (Örn: Evim, Yazlık)"
                        value={title}
                        onChangeText={setTitle}
                        mode="outlined"
                        style={styles.input}
                        outlineColor={COLORS.border}
                        activeOutlineColor={COLORS.primary}
                    />
                    <TextInput
                        label="Adres (Opsiyonel)"
                        value={address}
                        onChangeText={setAddress}
                        mode="outlined"
                        multiline
                        style={styles.input}
                        outlineColor={COLORS.border}
                        activeOutlineColor={COLORS.primary}
                    />
                    <TextInput
                        label="DASK Poliçe No (Opsiyonel)"
                        value={daskNumber}
                        onChangeText={setDaskNumber}
                        mode="outlined"
                        style={styles.input}
                        outlineColor={COLORS.border}
                        activeOutlineColor={COLORS.primary}
                    />
                    <TextInput
                        label="İnternet Abone No (Opsiyonel)"
                        value={internetNumber}
                        onChangeText={setInternetNumber}
                        mode="outlined"
                        style={styles.input}
                        outlineColor={COLORS.border}
                        activeOutlineColor={COLORS.primary}
                    />
                    <TextInput
                        label="Ev Sahibi / Kullanıcı Adı"
                        value={ownerName}
                        onChangeText={setOwnerName}
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
                    Ev Ekle
                </Button>

                <View style={{ height: 100 }} />
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '700',
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
        marginBottom: 8,
    },
    input: {
    },
    saveButton: {
        borderRadius: 8,
        marginTop: 16,
    },
    imageContainer: {
        width: '100%',
        height: 180,
        borderRadius: 12,
        overflow: 'hidden',
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
        borderRadius: 12,
    },
    placeholderText: {
        marginTop: 8,
        fontSize: 14,
    },
});
