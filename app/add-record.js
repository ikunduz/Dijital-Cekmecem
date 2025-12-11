import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Alert } from 'react-native';
import { TextInput, Button, Icon } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useCarContext } from '../context/CarContext';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';

const COLORS = {
    primary: "#1d72d3",
    background: "#E5E7EB",
    textDark: "#111417",
    textGray: "#647487",
    white: "#FFFFFF",
    border: "#e5e7eb",
};

// Helper function to parse Turkish date format (DD.MM.YYYY) or year-only
const parseDate = (dateStr) => {
    if (!dateStr) return new Date(0);
    const parts = dateStr.split('.');
    // If format is DD.MM.YYYY
    if (parts.length === 3) {
        return new Date(parts[2], parts[1] - 1, parts[0]);
    }
    // If only year provided (e.g., "2023")
    if (parts.length === 1 && /^[0-9]{4}$/.test(parts[0])) {
        const year = parseInt(parts[0], 10);
        return new Date(year, 0, 1); // Jan 1 of that year
    }
    return new Date(0);
};
export default function AddRecord() {
    const router = useRouter();
    const { recordId } = useLocalSearchParams();
    const { addRecord, editRecord, history, carProfile, updateCarProfile } = useCarContext();
    const [recordType, setRecordType] = useState('fuel'); // fuel, service, doc
    const [subType, setSubType] = useState(''); // insurance, inspection, license, other

    // MTV State
    const [mtvYear, setMtvYear] = useState(new Date().getFullYear().toString());
    const [mtvPeriods, setMtvPeriods] = useState([]); // ['jan', 'jul']

    // Inspection State
    const [inspectionPeriod, setInspectionPeriod] = useState(2); // 1, 2, or 3 years

    // Service State
    const [isPeriodicMaintenance, setIsPeriodicMaintenance] = useState(false);

    // Calculate last KM from history (smart default)
    const lastKmFromHistory = useMemo(() => {
        if (!history || history.length === 0) return '';
        // Sort by date descending to get latest record
        const sorted = [...history].sort((a, b) => parseDate(b.date) - parseDate(a.date));
        return sorted[0]?.km || '';
    }, [history]);

    // Form State - KM now uses smart default from last record
    const [date, setDate] = useState(new Date().toLocaleDateString('tr-TR'));
    const [km, setKm] = useState(lastKmFromHistory);
    const [liters, setLiters] = useState('');
    const [amount, setAmount] = useState('');
    const [notes, setNotes] = useState('');
    const [imageUri, setImageUri] = useState(null);
    const [isPdf, setIsPdf] = useState(false); // Track if file is PDF

    // New fields for Ruhsat
    const [motorNo, setMotorNo] = useState('');
    const [chasisNo, setChasisNo] = useState('');

    // New fields for Kasko/Insurance
    const [insuranceCompany, setInsuranceCompany] = useState('');

    // Edit Mode: Pre-fill data
    useEffect(() => {
        if (recordId) {
            const recordToEdit = history.find(r => r.id.toString() === recordId);
            if (recordToEdit) {
                setRecordType(recordToEdit.type);
                if (recordToEdit.type === 'doc') {
                    setSubType(recordToEdit.subType || 'other');
                }
                setDate(recordToEdit.date);
                setKm(recordToEdit.km);
                setLiters(recordToEdit.liters ? recordToEdit.liters.toString() : '');
                setAmount(recordToEdit.cost);
                setNotes(recordToEdit.description);
                setImageUri(recordToEdit.image);
            }
        }
    }, [recordId, history]);

    // Reset form when record type changes (don't carry over between types)
    useEffect(() => {
        // Only reset if NOT in edit mode
        if (!recordId) {
            setImageUri(null);
            setIsPdf(false);
            setMotorNo('');
            setChasisNo('');
            setInsuranceCompany('');
            setAmount('');
            setNotes('');
            setSubType('');
        }
    }, [recordType]);

    // Reset form fields when subType changes
    useEffect(() => {
        if (!recordId) {
            setImageUri(null);
            setIsPdf(false);
            setAmount('');
            setNotes('');
        }
    }, [subType]);

    const types = [
        { key: 'fuel', label: 'Yakıt', icon: 'gas-station' },
        { key: 'service', label: 'Bakım', icon: 'wrench' },
        { key: 'doc', label: 'Resmi Belge', icon: 'file-document' },
    ];

    // --- IMAGE / DOCUMENT PICKING ---

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

    // PDF Document Picker
    const pickDocument = async () => {
        try {
            const result = await DocumentPicker.getDocumentAsync({
                type: 'application/pdf',
                copyToCacheDirectory: true,
            });

            if (!result.canceled && result.assets && result.assets.length > 0) {
                setImageUri(result.assets[0].uri);
                setIsPdf(true); // Mark as PDF
            }
        } catch (error) {
            console.error('Document picker error:', error);
            Alert.alert("Hata", "PDF seçilirken bir hata oluştu.");
        }
    };

    // Camera Logic
    const openCamera = async () => {
        try {
            const permissionResult = await ImagePicker.requestCameraPermissionsAsync();

            if (permissionResult.granted === false) {
                Alert.alert("İzin Gerekli", "Kamera erişimi için izin vermeniz gerekiyor.");
                return;
            }

            let result = await ImagePicker.launchCameraAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                quality: 0.5,
            });

            if (!result.canceled) {
                setImageUri(result.assets[0].uri);
                setIsPdf(false); // Mark as image
            }
        } catch (error) {
            console.error('Camera error:', error);
            Alert.alert("Hata", "Fotoğraf çekilirken bir hata oluştu.");
        }
    };

    // Gallery Logic
    const openGallery = async () => {
        try {
            let result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                quality: 0.5,
            });

            if (!result.canceled) {
                setImageUri(result.assets[0].uri);
                setIsPdf(false); // Mark as image
            }
        } catch (error) {
            console.error('Gallery error:', error);
            Alert.alert("Hata", "Fotoğraf seçilirken bir hata oluştu.");
        }
    };

    return (
        <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>

            {/* 1. HEADER */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.closeButton}>
                    <Icon source="close" size={24} color={COLORS.textDark} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>{recordId ? 'Kaydı Güncelle' : 'Yeni Kayıt Ekle'}</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent}>

                {/* 2. TYPE SELECTOR */}
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

                {/* 2.1 SUB-TYPE SELECTOR (Only for Docs) */}
                {recordType === 'doc' && (
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.subTypeContainer}>
                        {[
                            { key: 'license', label: 'Ruhsat' },
                            { key: 'kasko', label: 'Kasko' },
                            { key: 'insurance', label: 'Trafik Sigortası' },
                            { key: 'inspection', label: 'Muayene' },
                            { key: 'mtv', label: 'MTV' },
                            { key: 'accident', label: 'Kaza/Hasar' },
                            { key: 'eksper', label: 'Eksper' },
                            { key: 'other', label: 'Diğer' }
                        ].map((sub) => {
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
                )}

                {/* 2.2 MTV SPECIAL UI */}
                {(recordType === 'doc' && subType === 'mtv') ? (
                    <View style={styles.mtvContainer}>
                        <Text style={styles.mtvYear}>{mtvYear}</Text>

                        <View style={styles.mtvPeriodContainer}>
                            <TouchableOpacity
                                style={[styles.mtvPeriodButton, mtvPeriods.includes('jan') && styles.mtvPeriodButtonActive]}
                                onPress={() => {
                                    if (mtvPeriods.includes('jan')) {
                                        setMtvPeriods(mtvPeriods.filter(p => p !== 'jan'));
                                    } else {
                                        setMtvPeriods([...mtvPeriods, 'jan']);
                                    }
                                }}
                            >
                                <Text style={[styles.mtvPeriodText, mtvPeriods.includes('jan') && styles.mtvPeriodTextActive]}>OCAK</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[styles.mtvPeriodButton, mtvPeriods.includes('jul') && styles.mtvPeriodButtonActive]}
                                onPress={() => {
                                    if (mtvPeriods.includes('jul')) {
                                        setMtvPeriods(mtvPeriods.filter(p => p !== 'jul'));
                                    } else {
                                        setMtvPeriods([...mtvPeriods, 'jul']);
                                    }
                                }}
                            >
                                <Text style={[styles.mtvPeriodText, mtvPeriods.includes('jul') && styles.mtvPeriodTextActive]}>TEMMUZ</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                ) : null}

                {/* 2.3 INSPECTION SPECIAL UI */}
                {(recordType === 'doc' && subType === 'inspection') ? (
                    <View style={styles.mtvContainer}>
                        <Text style={styles.mtvYear}>Muayene Periyodu</Text>

                        <View style={styles.mtvPeriodContainer}>
                            {[1, 2, 3].map((years) => (
                                <TouchableOpacity
                                    key={years}
                                    style={[styles.mtvPeriodButton, inspectionPeriod === years && styles.mtvPeriodButtonActive]}
                                    onPress={() => setInspectionPeriod(years)}
                                >
                                    <Text style={[styles.mtvPeriodText, inspectionPeriod === years && styles.mtvPeriodTextActive]}>
                                        {years} YIL
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>
                ) : null}

                {/* 3. FORM INPUTS */}
                <View style={styles.formContainer}>

                    {/* === RUHSAT FORM === */}
                    {(recordType === 'doc' && subType === 'license') && (
                        <>
                            <TextInput
                                label="İlk Tescil Tarihi"
                                value={date}
                                onChangeText={setDate}
                                mode="outlined"
                                style={styles.input}
                                outlineColor={COLORS.border}
                                activeOutlineColor={COLORS.primary}
                                right={<TextInput.Icon icon="calendar" />}
                            />
                            <TextInput
                                label="Motor No"
                                value={motorNo}
                                onChangeText={setMotorNo}
                                mode="outlined"
                                style={styles.input}
                                outlineColor={COLORS.border}
                                activeOutlineColor={COLORS.primary}
                                right={<TextInput.Icon icon="engine" />}
                            />
                            <TextInput
                                label="Şase No"
                                value={chasisNo}
                                onChangeText={setChasisNo}
                                mode="outlined"
                                style={styles.input}
                                outlineColor={COLORS.border}
                                activeOutlineColor={COLORS.primary}
                                right={<TextInput.Icon icon="car-info" />}
                            />
                        </>
                    )}

                    {/* === KASKO / SIGORTA FORM === */}
                    {(recordType === 'doc' && (subType === 'kasko' || subType === 'insurance')) && (
                        <>
                            <TextInput
                                label="Sigorta Yaptırdığınız Tarih"
                                value={date}
                                onChangeText={setDate}
                                mode="outlined"
                                style={styles.input}
                                outlineColor={COLORS.border}
                                activeOutlineColor={COLORS.primary}
                                right={<TextInput.Icon icon="calendar" />}
                            />
                            <TextInput
                                label="Sigorta Şirketi"
                                value={insuranceCompany}
                                onChangeText={setInsuranceCompany}
                                mode="outlined"
                                style={styles.input}
                                outlineColor={COLORS.border}
                                activeOutlineColor={COLORS.primary}
                                right={<TextInput.Icon icon="domain" />}
                            />
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
                        </>
                    )}

                    {/* === EXPER DOC TYPE (NEW) === */}
                    {(recordType === 'doc' && subType === 'eksper') && (
                        <>
                            <TextInput
                                label="Rapor Tarihi"
                                value={date}
                                onChangeText={setDate}
                                mode="outlined"
                                style={styles.input}
                                outlineColor={COLORS.border}
                                activeOutlineColor={COLORS.primary}
                                right={<TextInput.Icon icon="calendar" />}
                            />
                        </>
                    )}

                    {/* === OTHER DOC TYPES (accident, other) === */}
                    {(recordType === 'doc' && (subType === 'accident' || subType === 'other')) && (
                        <>
                            <TextInput
                                label="Tarih"
                                value={date}
                                onChangeText={setDate}
                                mode="outlined"
                                style={styles.input}
                                outlineColor={COLORS.border}
                                activeOutlineColor={COLORS.primary}
                                right={<TextInput.Icon icon="calendar" />}
                            />
                            <TextInput
                                label="Açıklama / Not"
                                value={notes}
                                onChangeText={setNotes}
                                mode="outlined"
                                multiline
                                numberOfLines={3}
                                style={[styles.input, { height: 'auto', minHeight: 80 }]}
                                outlineColor={COLORS.border}
                                activeOutlineColor={COLORS.primary}
                            />
                        </>
                    )}

                    {/* === SERVICE FORM === */}
                    {recordType === 'service' && (
                        <>
                            <TextInput
                                label="Son Bakım Tarihi"
                                value={date}
                                onChangeText={setDate}
                                mode="outlined"
                                style={styles.input}
                                outlineColor={COLORS.border}
                                activeOutlineColor={COLORS.primary}
                                right={<TextInput.Icon icon="calendar" />}
                            />
                            <TextInput
                                label="KM Bilgisi"
                                value={km}
                                onChangeText={setKm}
                                mode="outlined"
                                keyboardType="numeric"
                                style={styles.input}
                                outlineColor={COLORS.border}
                                activeOutlineColor={COLORS.primary}
                                right={<TextInput.Icon icon="speedometer" />}
                            />
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
                                label="Açıklama / Not"
                                value={notes}
                                onChangeText={setNotes}
                                mode="outlined"
                                multiline
                                numberOfLines={3}
                                style={[styles.input, { height: 'auto', minHeight: 80 }]}
                                outlineColor={COLORS.border}
                                activeOutlineColor={COLORS.primary}
                            />
                        </>
                    )}

                    {/* === FUEL FORM === */}
                    {recordType === 'fuel' && (
                        <>
                            <TextInput
                                label="KM Bilgisi"
                                value={km}
                                onChangeText={setKm}
                                mode="outlined"
                                keyboardType="numeric"
                                style={styles.input}
                                outlineColor={COLORS.border}
                                activeOutlineColor={COLORS.primary}
                                right={<TextInput.Icon icon="speedometer" />}
                            />
                            <TextInput
                                label="Alınan Litre"
                                value={liters}
                                onChangeText={setLiters}
                                mode="outlined"
                                keyboardType="numeric"
                                style={styles.input}
                                outlineColor={COLORS.border}
                                activeOutlineColor={COLORS.primary}
                                right={<TextInput.Icon icon="gas-station" />}
                            />
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
                        </>
                    )}

                    {/* Service: Periodic Maintenance Toggle + Interval Selector */}
                    {recordType === 'service' && (
                        <View style={styles.maintenanceSection}>
                            <TouchableOpacity
                                style={[
                                    styles.checkboxContainer,
                                    isPeriodicMaintenance && { borderColor: COLORS.primary, backgroundColor: '#EBF5FF' }
                                ]}
                                onPress={() => setIsPeriodicMaintenance(!isPeriodicMaintenance)}
                            >
                                <Icon
                                    source={isPeriodicMaintenance ? "checkbox-marked" : "checkbox-blank-outline"}
                                    size={28}
                                    color={isPeriodicMaintenance ? COLORS.primary : COLORS.textGray}
                                />
                                <View style={{ flex: 1 }}>
                                    <Text style={[styles.checkboxLabel, isPeriodicMaintenance && { color: COLORS.primary, fontWeight: '700' }]}>
                                        Periyodik Bakım
                                    </Text>
                                    <Text style={{ fontSize: 12, color: COLORS.textGray, marginTop: 2 }}>
                                        İşaretle → Son bakım bilgisi otomatik güncellenir
                                    </Text>
                                </View>
                            </TouchableOpacity>

                            {/* Show interval selector when checkbox is active */}
                            {isPeriodicMaintenance && (
                                <View style={styles.intervalSelector}>
                                    <Text style={{ fontSize: 13, color: COLORS.textDark, marginBottom: 8, fontWeight: '500' }}>
                                        Bakım Aralığı:
                                    </Text>
                                    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                                        {['10000', '15000', '20000'].map((val, index, array) => {
                                            const isActive = String(carProfile?.maintenanceIntervalKm || '15000') === String(val);
                                            return (
                                                <TouchableOpacity
                                                    key={val}
                                                    onPress={async () => {
                                                        await updateCarProfile({ maintenanceIntervalKm: parseInt(val) });
                                                    }}
                                                    style={{
                                                        flex: 1,
                                                        marginRight: index === array.length - 1 ? 0 : 8,
                                                        paddingVertical: 10,
                                                        borderRadius: 8,
                                                        backgroundColor: isActive ? COLORS.primary : COLORS.white,
                                                        borderWidth: 1,
                                                        borderColor: isActive ? COLORS.primary : COLORS.border,
                                                        alignItems: 'center',
                                                    }}
                                                >
                                                    <Text style={{
                                                        color: isActive ? COLORS.white : COLORS.textGray,
                                                        fontWeight: '600',
                                                        fontSize: 13,
                                                    }}>
                                                        {parseInt(val).toLocaleString('tr-TR')} KM
                                                    </Text>
                                                </TouchableOpacity>
                                            );
                                        })}
                                    </View>
                                </View>
                            )}
                        </View>
                    )}
                </View>

                {/* 4. PHOTO/DOCUMENT ATTACHMENT (Hidden for Fuel) */}
                {recordType !== 'fuel' && (
                    imageUri ? (
                        <View style={styles.imagePreviewContainer}>
                            {isPdf ? (
                                // PDF Preview - Show icon and filename
                                <View style={styles.pdfPreview}>
                                    <Icon source="file-pdf-box" size={64} color="#ef4444" />
                                    <Text style={styles.pdfText}>PDF Dosyası Eklendi</Text>
                                </View>
                            ) : (
                                // Image Preview
                                <Image source={{ uri: imageUri }} style={styles.previewImage} resizeMode="contain" />
                            )}

                            {/* X button to remove file */}
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
                                <Text style={styles.photoText}>
                                    {subType === 'mtv' ? 'Dekont Yükle' : 'Foto / Belge Ekle'}
                                </Text>
                            </View>
                        </TouchableOpacity>
                    )
                )}

            </ScrollView>

            {/* 5. SAVE BUTTON */}
            <View style={styles.footer}>
                <Button
                    mode="contained"
                    onPress={async () => {
                        // VALIDATION
                        if (recordType === 'doc' && !subType) {
                            Alert.alert('Eksik Bilgi', 'Lütfen belge türünü (Kasko, Ruhsat vb.) seçiniz.');
                            return;
                        }

                        // SPECIAL: Inspection saves to carProfile, not history
                        if (recordType === 'doc' && subType === 'inspection') {
                            await updateCarProfile({
                                lastInspectionDate: date,
                                inspectionPeriodYears: inspectionPeriod
                            });
                            Alert.alert('Başarılı', 'Muayene bilgisi kaydedildi.', [
                                { text: 'Tamam', onPress: () => router.back() }
                            ]);
                            return;
                        }

                        // SPECIAL: Service with Periodic Maintenance checked -> Update carProfile
                        if (recordType === 'service' && isPeriodicMaintenance) {
                            await updateCarProfile({
                                lastMaintenanceDate: date,
                                lastMaintenanceKm: parseInt(km)
                            });
                            // We still continue to save the record to history below!
                        }

                        const recordData = {
                            type: recordType,
                            subType: recordType === 'doc' ? subType : null,
                            // MTV specific
                            mtvYear: (recordType === 'doc' && subType === 'mtv') ? mtvYear : null,
                            mtvPeriods: (recordType === 'doc' && subType === 'mtv') ? mtvPeriods : [],
                            // Common fields
                            date,
                            km: (recordType === 'doc') ? null : km,
                            liters: recordType === 'fuel' ? liters : null,
                            cost: amount,
                            description: notes,
                            image: imageUri,
                            // Ruhsat specific
                            motorNo: subType === 'license' ? motorNo : null,
                            chasisNo: subType === 'license' ? chasisNo : null,
                            // Insurance specific
                            insuranceCompany: (subType === 'kasko' || subType === 'insurance') ? insuranceCompany : null,
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

    // TYPE SELECTOR
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

    // SUB-TYPE
    subTypeContainer: {
        flexDirection: 'row',
        marginBottom: 24,
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
    // MTV STYLES
    mtvContainer: {
        alignItems: 'center',
        marginVertical: 16,
        gap: 16,
    },
    mtvYear: {
        fontSize: 32,
        fontWeight: '800',
        color: COLORS.primary,
        letterSpacing: 2,
    },
    mtvPeriodContainer: {
        flexDirection: 'row',
        gap: 16,
    },
    mtvPeriodButton: {
        paddingVertical: 12,
        paddingHorizontal: 24,
        borderRadius: 8,
        borderWidth: 2,
        borderColor: COLORS.border,
        backgroundColor: COLORS.white,
        minWidth: 100,
        alignItems: 'center',
    },
    mtvPeriodButtonActive: {
        borderColor: COLORS.primary,
        backgroundColor: COLORS.primary,
    },
    mtvPeriodText: {
        fontSize: 16,
        fontWeight: '700',
        color: COLORS.textGray,
    },
    mtvPeriodTextActive: {
        color: COLORS.white,
    },

    // CHECKBOX (Periodic Maintenance)
    checkboxContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 16,
        paddingHorizontal: 16,
        gap: 12,
        marginTop: 8,
        backgroundColor: COLORS.background,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    checkboxLabel: {
        fontSize: 15,
        color: COLORS.textDark,
        flex: 1,
    },
    maintenanceSection: {
        marginTop: 8,
    },
    intervalSelector: {
        marginTop: 12,
        padding: 12,
        backgroundColor: COLORS.background,
        borderRadius: 8,
    },

    // FORM
    formContainer: {
        marginBottom: 24,
        gap: 16,
    },
    input: {
        backgroundColor: COLORS.white,
    },

    // PHOTO
    photoBox: {
        borderWidth: 2,
        borderColor: COLORS.border,
        borderStyle: 'dashed',
        borderRadius: 12,
        height: 120,
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
        fontWeight: '500',
    },
    imagePreviewContainer: {
        position: 'relative',
        marginBottom: 16,
    },
    previewImage: {
        width: '100%',
        height: 300,
        backgroundColor: COLORS.background,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    removeImageButton: {
        position: 'absolute',
        top: 8,
        right: 8,
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: 'rgba(0,0,0,0.6)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    pdfPreview: {
        width: '100%',
        height: 150,
        backgroundColor: '#fef2f2',
        borderRadius: 12,
        borderWidth: 2,
        borderColor: '#fecaca',
        borderStyle: 'dashed',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 8,
    },
    pdfText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#ef4444',
    },

    // FOOTER
    footer: {
        padding: 16,
        borderTopWidth: 1,
        borderTopColor: COLORS.border,
        backgroundColor: COLORS.white,
    },
    saveButton: {
        borderRadius: 8,
    }
});
