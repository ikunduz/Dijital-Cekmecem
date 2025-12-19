import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Alert } from 'react-native';
import { TextInput, Button, Icon, SegmentedButtons } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useHomeContext } from '../context/HomeContext';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';

const COLORS = {
    primary: "#F57C00",
    background: "#E5E7EB",
    textDark: "#111417",
    textGray: "#647487",
    white: "#FFFFFF",
    border: "#e5e7eb",
};

export default function AddRecord() {
    const router = useRouter();
    const { recordId } = useLocalSearchParams();
    const { addRecord, editRecord, history, homeProfile } = useHomeContext();

    // Types: 'warranty' (Garanti/Eşya), 'doc' (Belge)
    const [recordType, setRecordType] = useState('warranty');
    const [subType, setSubType] = useState('');

    // Form State
    const [date, setDate] = useState(new Date().toLocaleDateString('tr-TR')); // Payment Date / Warranty End / Doc Date
    const [amount, setAmount] = useState('');
    const [notes, setNotes] = useState('');
    const [imageUri, setImageUri] = useState(null);
    const [isPdf, setIsPdf] = useState(false);

    // Bill Specific
    const [billIndex, setBillIndex] = useState(''); // Endeks (Optional)
    const [dueDate, setDueDate] = useState(''); // Son Ödeme Tarihi

    // Warranty Specific
    const [productName, setProductName] = useState('');
    const [brand, setBrand] = useState('');

    // Edit Mode: Pre-fill data
    useEffect(() => {
        if (recordId) {
            const recordToEdit = history.find(r => r.id.toString() === recordId);
            if (recordToEdit) {
                setRecordType(recordToEdit.type);
                setSubType(recordToEdit.subType || '');
                setDate(recordToEdit.date);
                setAmount(recordToEdit.cost);
                setNotes(recordToEdit.description);
                setImageUri(recordToEdit.image);

                // Load specific fields
                if (recordToEdit.type === 'bill') {
                    setBillIndex(recordToEdit.index || '');
                    setDueDate(recordToEdit.dueDate || '');
                } else if (recordToEdit.type === 'warranty') {
                    setProductName(recordToEdit.productName || '');
                    setBrand(recordToEdit.brand || '');
                    // recordToEdit.date might be warranty end date usage
                }
            }
        }
    }, [recordId, history]);

    // Reset when type changes (if not editing)
    useEffect(() => {
        if (!recordId) {
            setImageUri(null);
            setIsPdf(false);
            setAmount('');
            setNotes('');
            setSubType('');
            setBillIndex('');
            setDueDate('');
            setProductName('');
            setBrand('');
            // setDate(new Date().toLocaleDateString('tr-TR')); // Keep today as default
        }
    }, [recordType]);

    const types = [
        { key: 'warranty', label: 'Garanti/Eşya', icon: 'shield-check' },
        { key: 'doc', label: 'Belge/Evrak', icon: 'file-document' },
    ];

    const pickImage = async () => {
        Alert.alert(
            "Foto/Belge Ekle",
            "Nasıl eklemek istersiniz?",
            [
                { text: "Kamera", onPress: openCamera },
                { text: "Galeri", onPress: openGallery },
                { text: "PDF Dosya", onPress: pickDocument },
                { text: "İptal", style: "cancel" }
            ]
        );
    };

    const pickDocument = async () => {
        try {
            const result = await DocumentPicker.getDocumentAsync({
                type: 'application/pdf',
                copyToCacheDirectory: true,
            });
            if (!result.canceled && result.assets && result.assets.length > 0) {
                setImageUri(result.assets[0].uri);
                setIsPdf(true);
            }
        } catch (error) {
            console.error('Document picker error:', error);
            Alert.alert("Hata", "PDF seçilirken bir hata oluştu.");
        }
    };

    const openCamera = async () => {
        const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
        if (permissionResult.granted === false) {
            Alert.alert("İzin Gerekli", "Kamera erişimi için izin vermeniz gerekiyor.");
            return;
        }
        let result = await ImagePicker.launchCameraAsync({
            allowsEditing: true,
            quality: 0.5,
        });
        if (!result.canceled) {
            setImageUri(result.assets[0].uri);
            setIsPdf(false);
        }
    };

    const openGallery = async () => {
        let result = await ImagePicker.launchImageLibraryAsync({
            allowsEditing: true,
            quality: 0.5,
        });
        if (!result.canceled) {
            setImageUri(result.assets[0].uri);
            setIsPdf(false);
        }
    };

    // --- Subtypes Data ---
    const billSubtypes = [
        { key: 'electricity', label: 'Elektrik' },
        { key: 'water', label: 'Su' },
        { key: 'gas', label: 'Doğalgaz' },
        { key: 'internet', label: 'İnternet' },
        { key: 'dues', label: 'Aidat' },
        { key: 'phone', label: 'Telefon' },
        { key: 'other', label: 'Diğer' },
    ];

    const warrantySubtypes = [
        { key: 'appliance', label: 'Beyaz Eşya' },
        { key: 'electronics', label: 'Elektronik' },
        { key: 'furniture', label: 'Mobilya' },
        { key: 'other', label: 'Diğer' },
    ];

    const docSubtypes = [
        { key: 'deed', label: 'Tapu' },
        { key: 'contract', label: 'Kira Kontratı' },
        { key: 'dask', label: 'DASK' },
        { key: 'id', label: 'Kimlik' },
        { key: 'other', label: 'Diğer' },
    ];

    const currentSubtypes = recordType === 'warranty' ? warrantySubtypes : docSubtypes;

    return (
        <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
            {/* HEADER */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.closeButton}>
                    <Icon source="close" size={24} color={COLORS.textDark} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>{recordId ? 'Kaydı Güncelle' : 'Yeni Kayıt Ekle'}</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent}>

                {/* 1. TYPE SELECTOR */}
                <View style={styles.typeContainer}>
                    {types.map((type) => {
                        const isActive = recordType === type.key;
                        return (
                            <TouchableOpacity
                                key={type.key}
                                style={[styles.typeButton, isActive && styles.typeButtonActive]}
                                onPress={() => setRecordType(type.key)}
                            >
                                <Icon
                                    source={type.icon}
                                    size={20}
                                    color={isActive ? COLORS.white : COLORS.textGray}
                                />
                                <Text style={[styles.typeText, isActive && styles.typeTextActive]}>
                                    {type.label}
                                </Text>
                            </TouchableOpacity>
                        )
                    })}
                </View>

                {/* 2. SUB-TYPE SELECTOR (Horizontal Scroll) */}
                <View style={{ marginBottom: 24 }}>
                    <Text style={styles.sectionLabel}>
                        {recordType === 'bill' ? 'Fatura Türü' :
                            recordType === 'warranty' ? 'Eşya Grubu' : 'Belge Türü'}
                    </Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.subTypeContainer}>
                        {currentSubtypes.map((sub) => {
                            const isActive = subType === sub.key;
                            return (
                                <TouchableOpacity
                                    key={sub.key}
                                    style={[styles.subTypeChip, isActive && styles.subTypeChipActive]}
                                    onPress={() => setSubType(sub.key)}
                                >
                                    <Text style={[styles.subTypeText, isActive && styles.subTypeTextActive]}>
                                        {sub.label}
                                    </Text>
                                </TouchableOpacity>
                            );
                        })}
                    </ScrollView>
                </View>

                {/* 3. FORM INPUTS */}
                <View style={styles.formContainer}>

                    {/* === BILL FORM === */}
                    {recordType === 'bill' && (
                        <>
                            <TextInput
                                label="Tutar (TL)"
                                value={amount}
                                onChangeText={setAmount}
                                mode="outlined"
                                keyboardType="numeric"
                                style={styles.input}
                                outlineColor={COLORS.border}
                                activeOutlineColor={COLORS.primary}
                                right={<TextInput.Icon icon="currency-try" />}
                            />
                            <TextInput
                                label="Son Ödeme Tarihi"
                                value={dueDate}
                                onChangeText={setDueDate}
                                mode="outlined"
                                placeholder="GG.AA.YYYY"
                                style={styles.input}
                                outlineColor={COLORS.border}
                                activeOutlineColor={COLORS.primary}
                                right={<TextInput.Icon icon="calendar-clock" />}
                            />
                            <TextInput
                                label="Sayaç Endeksi (Opsiyonel)"
                                value={billIndex}
                                onChangeText={setBillIndex}
                                mode="outlined"
                                keyboardType="numeric"
                                style={styles.input}
                                outlineColor={COLORS.border}
                                activeOutlineColor={COLORS.primary}
                                right={<TextInput.Icon icon="counter" />}
                            />
                        </>
                    )}

                    {/* === WARRANTY FORM === */}
                    {recordType === 'warranty' && (
                        <>
                            <TextInput
                                label="Ürün Adı (Örn: Çamaşır Makinesi)"
                                value={productName}
                                onChangeText={setProductName}
                                mode="outlined"
                                style={styles.input}
                                outlineColor={COLORS.border}
                                activeOutlineColor={COLORS.primary}
                            />
                            <TextInput
                                label="Marka / Model"
                                value={brand}
                                onChangeText={setBrand}
                                mode="outlined"
                                style={styles.input}
                                outlineColor={COLORS.border}
                                activeOutlineColor={COLORS.primary}
                            />
                            <TextInput
                                label="Garanti Bitiş Tarihi"
                                value={date}
                                onChangeText={setDate}
                                mode="outlined"
                                placeholder="GG.AA.YYYY"
                                style={styles.input}
                                outlineColor={COLORS.border}
                                activeOutlineColor={COLORS.primary}
                                right={<TextInput.Icon icon="calendar-check" />}
                            />
                            <TextInput
                                label="Fatura Tutarı (Opsiyonel)"
                                value={amount}
                                onChangeText={setAmount}
                                mode="outlined"
                                keyboardType="numeric"
                                style={styles.input}
                                outlineColor={COLORS.border}
                                activeOutlineColor={COLORS.primary}
                                right={<TextInput.Icon icon="currency-try" />}
                            />
                        </>
                    )}

                    {/* === DOC FORM === */}
                    {recordType === 'doc' && (
                        <>
                            <TextInput
                                label="Belge Tarihi / Başlangıç"
                                value={date}
                                onChangeText={setDate}
                                mode="outlined"
                                placeholder="GG.AA.YYYY"
                                style={styles.input}
                                outlineColor={COLORS.border}
                                activeOutlineColor={COLORS.primary}
                                right={<TextInput.Icon icon="calendar" />}
                            />
                            <TextInput
                                label="Tutar / Değer (Opsiyonel)"
                                value={amount}
                                onChangeText={setAmount}
                                mode="outlined"
                                keyboardType="numeric"
                                style={styles.input}
                                outlineColor={COLORS.border}
                                activeOutlineColor={COLORS.primary}
                                right={<TextInput.Icon icon="currency-try" />}
                            />
                        </>
                    )}

                    {/* Common Notes */}
                    <TextInput
                        label="Açıklama / Not"
                        value={notes}
                        onChangeText={setNotes}
                        mode="outlined"
                        multiline
                        numberOfLines={3}
                        style={[styles.input, { minHeight: 80 }]}
                        outlineColor={COLORS.border}
                        activeOutlineColor={COLORS.primary}
                    />

                </View>

                {/* 4. ATTACHMENT */}
                <View style={{ marginTop: 20 }}>
                    <Text style={styles.sectionLabel}>Fotoğraf / Belge</Text>
                    {imageUri ? (
                        <View style={styles.imagePreviewContainer}>
                            {isPdf ? (
                                <View style={styles.pdfPreview}>
                                    <Icon source="file-pdf-box" size={64} color="#ef4444" />
                                    <Text style={styles.pdfText}>PDF Dosyası Eklendi</Text>
                                </View>
                            ) : (
                                <Image source={{ uri: imageUri }} style={styles.previewImage} resizeMode="contain" />
                            )}
                            <TouchableOpacity
                                style={styles.removeImageButton}
                                onPress={() => { setImageUri(null); setIsPdf(false); }}
                            >
                                <Icon source="close" size={20} color={COLORS.white} />
                            </TouchableOpacity>
                        </View>
                    ) : (
                        <TouchableOpacity style={styles.photoBox} onPress={pickImage}>
                            <View style={styles.photoInner}>
                                <Icon source="file-plus" size={32} color={COLORS.textGray} />
                                <Text style={styles.photoText}>Ekle</Text>
                            </View>
                        </TouchableOpacity>
                    )}
                </View>

            </ScrollView>

            {/* 5. SAVE BUTTON */}
            <View style={styles.footer}>
                <Button
                    mode="contained"
                    onPress={async () => {
                        if (!subType) {
                            Alert.alert('Eksik Bilgi', 'Lütfen tür seçimi yapınız.');
                            return;
                        }

                        const recordData = {
                            type: recordType,
                            subType,
                            date, // Due Date for Bill used differently? No, let's keep `date` as main date. For Bill: maybe date=PaymentDate or date=DueDate. Let's start with generic date.
                            dueDate: recordType === 'bill' ? dueDate : null,
                            cost: amount,
                            description: notes,
                            image: imageUri,
                            // Bill
                            index: recordType === 'bill' ? billIndex : null,
                            // Warranty
                            productName: recordType === 'warranty' ? productName : null,
                            brand: recordType === 'warranty' ? brand : null,
                        };

                        if (recordId) {
                            editRecord(parseInt(recordId), recordData);
                        } else {
                            addRecord(recordData);
                        }
                        router.back();
                    }}
                    style={styles.saveButton}
                    contentStyle={{ height: 50 }}
                    buttonColor={COLORS.primary}
                >
                    {recordId ? 'Güncelle' : 'Kaydet'}
                </Button>
            </View>
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
    scrollContent: {
        padding: 16,
        paddingBottom: 100,
    },
    typeContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 24,
        backgroundColor: COLORS.background,
        padding: 4,
        borderRadius: 12,
    },
    typeButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 10,
        borderRadius: 8,
        gap: 6,
    },
    typeButtonActive: {
        backgroundColor: COLORS.primary,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
    },
    typeText: {
        fontSize: 13,
        fontWeight: '500',
        color: COLORS.textGray,
    },
    typeTextActive: {
        color: COLORS.white,
        fontWeight: '600',
    },
    sectionLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: COLORS.textGray,
        marginBottom: 8,
        marginLeft: 4,
    },
    subTypeContainer: {
        flexDirection: 'row',
    },
    subTypeChip: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: COLORS.background,
        marginRight: 8,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    subTypeChipActive: {
        backgroundColor: COLORS.primary,
        borderColor: COLORS.primary,
    },
    subTypeText: {
        fontSize: 13,
        color: COLORS.textGray,
    },
    subTypeTextActive: {
        color: COLORS.white,
        fontWeight: '600',
    },
    formContainer: {
        gap: 16,
    },
    input: {
        backgroundColor: COLORS.white,
    },
    photoBox: {
        height: 120,
        borderWidth: 2,
        borderColor: COLORS.border,
        borderStyle: 'dashed',
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: COLORS.background,
    },
    photoInner: {
        alignItems: 'center',
        gap: 8,
    },
    photoText: {
        color: COLORS.textGray,
        fontSize: 14,
    },
    imagePreviewContainer: {
        height: 200,
        borderRadius: 12,
        overflow: 'hidden',
        backgroundColor: '#f3f4f6',
        justifyContent: 'center',
        alignItems: 'center',
        position: 'relative',
    },
    previewImage: {
        width: '100%',
        height: '100%',
    },
    pdfPreview: {
        alignItems: 'center',
        gap: 8,
    },
    pdfText: {
        color: COLORS.textDark,
        fontSize: 14,
        fontWeight: '500',
    },
    removeImageButton: {
        position: 'absolute',
        top: 8,
        right: 8,
        backgroundColor: 'rgba(0,0,0,0.5)',
        borderRadius: 20,
        padding: 4,
    },
    footer: {
        padding: 16,
        borderTopWidth: 1,
        borderTopColor: COLORS.border,
        backgroundColor: COLORS.white,
    },
    saveButton: {
        borderRadius: 8,
    },
});
