import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    TextInput,
    Alert,
    KeyboardAvoidingView,
    Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { IconButton, Switch } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { Icon } from 'react-native-paper';
import { showInterstitialIfQualified } from '../components/Ads';

import { useHomeContext } from '../context/HomeContext';
import { useFinanceContext, INCOME_CATEGORIES, EXPENSE_CATEGORIES } from '../context/FinanceContext';

const COLORS = {
    primary: '#F57C00',
    background: '#F0F2F5',
    white: '#FFFFFF',
    textDark: '#0f172a',
    textGray: '#647487',
    income: '#22c55e',
    expense: '#ef4444',
};

export default function AddTransactionScreen() {
    const router = useRouter();
    const { currentHomeId } = useHomeContext();
    const { addTransaction } = useFinanceContext();

    // Form state
    const [type, setType] = useState('expense'); // 'income' | 'expense'
    const [category, setCategory] = useState(null);
    const [amount, setAmount] = useState('');
    const [description, setDescription] = useState('');
    const [date, setDate] = useState(new Date());
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [imageUri, setImageUri] = useState(null);
    const [isPdf, setIsPdf] = useState(false);
    const [saving, setSaving] = useState(false);
    const [isRecurring, setIsRecurring] = useState(false);

    const categories = type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;

    const formatDate = (d) => {
        const day = d.getDate().toString().padStart(2, '0');
        const month = (d.getMonth() + 1).toString().padStart(2, '0');
        const year = d.getFullYear();
        return `${day}.${month}.${year}`;
    };

    const handleDateChange = (event, selectedDate) => {
        setShowDatePicker(false);
        if (selectedDate) {
            setDate(selectedDate);
        }
    };

    const pickAttachment = async () => {
        Alert.alert(
            "Belge/Fiş Ekle",
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

    const handleSave = async () => {
        // Validation
        if (!category) {
            Alert.alert('Hata', 'Lütfen bir kategori seçin');
            return;
        }
        if (!amount || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
            Alert.alert('Hata', 'Lütfen geçerli bir tutar girin');
            return;
        }

        setSaving(true);

        try {
            await addTransaction({
                type,
                category,
                amount: parseFloat(amount),
                description: description.trim(),
                date: formatDate(date),
                attachment: imageUri,
                isPdf: isPdf,
                isRecurring: isRecurring,
            }, currentHomeId);

            await showInterstitialIfQualified();
            router.back();
        } catch (e) {
            Alert.alert('Hata', 'İşlem kaydedilemedi');
            console.error(e);
        } finally {
            setSaving(false);
        }
    };

    return (
        <View style={styles.container}>
            {/* HEADER */}
            <LinearGradient
                colors={type === 'income' ? ['#22c55e', '#16a34a'] : ['#ef4444', '#dc2626']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.header}
            >
                <SafeAreaView edges={['top']}>
                    <View style={styles.headerRow}>
                        <TouchableOpacity onPress={() => router.back()}>
                            <IconButton icon="close" size={24} iconColor="white" />
                        </TouchableOpacity>
                        <Text style={styles.headerTitle}>
                            {type === 'income' ? 'Gelir Ekle' : 'Gider Ekle'}
                        </Text>
                        <TouchableOpacity onPress={handleSave} disabled={saving}>
                            <IconButton
                                icon="check"
                                size={24}
                                iconColor={saving ? 'rgba(255,255,255,0.5)' : 'white'}
                            />
                        </TouchableOpacity>
                    </View>
                </SafeAreaView>
            </LinearGradient>

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{ flex: 1 }}
            >
                <ScrollView style={styles.content} contentContainerStyle={{ paddingBottom: 40 }}>
                    {/* TYPE TOGGLE */}
                    <View style={styles.toggleContainer}>
                        <TouchableOpacity
                            style={[
                                styles.toggleButton,
                                type === 'income' && styles.toggleButtonActiveIncome,
                            ]}
                            onPress={() => { setType('income'); setCategory(null); }}
                        >
                            <MaterialCommunityIcons
                                name="trending-up"
                                size={22}
                                color={type === 'income' ? 'white' : COLORS.income}
                            />
                            <Text style={[
                                styles.toggleText,
                                type === 'income' && styles.toggleTextActive
                            ]}>
                                Gelir
                            </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[
                                styles.toggleButton,
                                type === 'expense' && styles.toggleButtonActiveExpense,
                            ]}
                            onPress={() => { setType('expense'); setCategory(null); }}
                        >
                            <MaterialCommunityIcons
                                name="trending-down"
                                size={22}
                                color={type === 'expense' ? 'white' : COLORS.expense}
                            />
                            <Text style={[
                                styles.toggleText,
                                type === 'expense' && styles.toggleTextActive
                            ]}>
                                Gider
                            </Text>
                        </TouchableOpacity>
                    </View>

                    {/* AMOUNT INPUT */}
                    <View style={styles.amountSection}>
                        <Text style={styles.amountLabel}>Tutar</Text>
                        <View style={styles.amountInputContainer}>
                            <TextInput
                                style={styles.amountInput}
                                value={amount}
                                onChangeText={setAmount}
                                placeholder="0"
                                placeholderTextColor="#cbd5e1"
                                keyboardType="numeric"
                            />
                            <Text style={styles.currencySymbol}>₺</Text>
                        </View>
                    </View>

                    {/* CATEGORY GRID */}
                    <View style={styles.section}>
                        <Text style={styles.sectionLabel}>Kategori Seçin</Text>
                        <View style={styles.categoryGrid}>
                            {categories.map((cat) => (
                                <TouchableOpacity
                                    key={cat.id}
                                    style={[
                                        styles.categoryItem,
                                        category === cat.id && {
                                            borderColor: cat.color,
                                            backgroundColor: cat.color + '15',
                                        }
                                    ]}
                                    onPress={() => setCategory(cat.id)}
                                >
                                    <View style={[styles.categoryIcon, { backgroundColor: cat.color + '20' }]}>
                                        <MaterialCommunityIcons name={cat.icon} size={24} color={cat.color} />
                                    </View>
                                    <Text style={styles.categoryLabel}>{cat.label}</Text>
                                    {category === cat.id && (
                                        <View style={[styles.checkBadge, { backgroundColor: cat.color }]}>
                                            <MaterialCommunityIcons name="check" size={12} color="white" />
                                        </View>
                                    )}
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>

                    {/* DATE PICKER */}
                    <View style={styles.section}>
                        <Text style={styles.sectionLabel}>Tarih</Text>
                        <TouchableOpacity
                            style={styles.dateButton}
                            onPress={() => setShowDatePicker(true)}
                        >
                            <MaterialCommunityIcons name="calendar" size={24} color={COLORS.textGray} />
                            <Text style={styles.dateText}>{formatDate(date)}</Text>
                        </TouchableOpacity>
                    </View>

                    {/* RECURRING TOGGLE */}
                    <View style={[styles.section, styles.recurringRow]}>
                        <View style={styles.recurringInfo}>
                            <MaterialCommunityIcons name="repeat" size={24} color={COLORS.textGray} />
                            <View style={{ marginLeft: 12 }}>
                                <Text style={styles.recurringTitle}>Her Ay Tekrarla</Text>
                                <Text style={styles.recurringSubtitle}>Her ay otomatik kayıt oluşturur</Text>
                            </View>
                        </View>
                        <Switch
                            value={isRecurring}
                            onValueChange={setIsRecurring}
                            color={type === 'income' ? COLORS.income : COLORS.expense}
                        />
                    </View>

                    {showDatePicker && (
                        <DateTimePicker
                            value={date}
                            mode="date"
                            display="default"
                            onChange={handleDateChange}
                            maximumDate={new Date()}
                        />
                    )}

                    {/* DESCRIPTION */}
                    <View style={styles.section}>
                        <Text style={styles.sectionLabel}>Açıklama (Opsiyonel)</Text>
                        <TextInput
                            style={styles.descriptionInput}
                            value={description}
                            onChangeText={setDescription}
                            placeholder="Örn: Migros alışverişi"
                            placeholderTextColor="#94a3b8"
                            multiline
                        />
                    </View>

                    {/* ATTACHMENT */}
                    <View style={styles.section}>
                        <Text style={styles.sectionLabel}>Fiş / Belge (Opsiyonel)</Text>
                        {imageUri ? (
                            <View style={styles.attachmentPreview}>
                                {isPdf ? (
                                    <View style={styles.pdfBadge}>
                                        <MaterialCommunityIcons name="file-pdf-box" size={40} color="#ef4444" />
                                        <Text style={styles.attachmentText}>PDF Eklendi</Text>
                                    </View>
                                ) : (
                                    <Image source={{ uri: imageUri }} style={styles.previewImage} resizeMode="cover" />
                                )}
                                <TouchableOpacity
                                    style={styles.removeAttachment}
                                    onPress={() => { setImageUri(null); setIsPdf(false); }}
                                >
                                    <MaterialCommunityIcons name="close-circle" size={24} color="white" />
                                </TouchableOpacity>
                            </View>
                        ) : (
                            <TouchableOpacity style={styles.attachButton} onPress={pickAttachment}>
                                <MaterialCommunityIcons name="camera-plus" size={24} color={COLORS.textGray} />
                                <Text style={styles.attachButtonText}>Fotoğraf veya Belge Ekle</Text>
                            </TouchableOpacity>
                        )}
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        paddingBottom: 16,
        borderBottomLeftRadius: 24,
        borderBottomRightRadius: 24,
    },
    headerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 8,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: 'white',
    },
    content: {
        flex: 1,
        paddingTop: 20,
    },
    toggleContainer: {
        flexDirection: 'row',
        marginHorizontal: 16,
        backgroundColor: '#f1f5f9',
        borderRadius: 16,
        padding: 4,
        marginBottom: 24,
    },
    toggleButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 14,
        borderRadius: 12,
        gap: 8,
        backgroundColor: 'transparent',
    },
    toggleButtonActiveIncome: {
        backgroundColor: '#22c55e',
    },
    toggleButtonActiveExpense: {
        backgroundColor: '#ef4444',
    },
    toggleText: {
        fontSize: 15,
        fontWeight: '700',
        color: '#64748b',
    },
    toggleTextActive: {
        color: 'white',
    },
    amountSection: {
        alignItems: 'center',
        marginBottom: 32,
    },
    amountLabel: {
        fontSize: 14,
        marginBottom: 8,
    },
    amountInputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    amountInput: {
        fontSize: 48,
        fontWeight: '700',
        textAlign: 'center',
        minWidth: 120,
    },
    currencySymbol: {
        fontSize: 32,
        fontWeight: '600',
        marginLeft: 4,
    },
    section: {
        marginHorizontal: 16,
        marginBottom: 24,
    },
    sectionLabel: {
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 12,
    },
    categoryGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10,
    },
    categoryItem: {
        width: '30%',
        borderRadius: 12,
        padding: 12,
        alignItems: 'center',
        borderWidth: 2,
        borderColor: 'transparent',
        position: 'relative',
    },
    categoryIcon: {
        width: 44,
        height: 44,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 8,
    },
    categoryLabel: {
        fontSize: 12,
        fontWeight: '500',
        textAlign: 'center',
    },
    checkBadge: {
        position: 'absolute',
        top: 6,
        right: 6,
        width: 20,
        height: 20,
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
    },
    dateButton: {
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: 12,
        padding: 16,
        gap: 12,
    },
    dateText: {
        fontSize: 16,
        fontWeight: '500',
    },
    descriptionInput: {
        borderRadius: 12,
        padding: 16,
        fontSize: 15,
        minHeight: 80,
        textAlignVertical: 'top',
        marginBottom: 8,
    },
    attachButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 12,
        padding: 16,
        gap: 12,
        borderWidth: 1,
        borderStyle: 'dashed',
    },
    attachButtonText: {
        fontSize: 14,
        fontWeight: '500',
    },
    attachmentPreview: {
        height: 120,
        borderRadius: 12,
        overflow: 'hidden',
        borderWidth: 1,
        position: 'relative',
    },
    previewImage: {
        width: '100%',
        height: '100%',
    },
    pdfBadge: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
    },
    attachmentText: {
        fontSize: 14,
        fontWeight: '600',
    },
    removeAttachment: {
        position: 'absolute',
        top: 8,
        right: 8,
        backgroundColor: 'rgba(0,0,0,0.4)',
        borderRadius: 12,
    },
    recurringRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 16,
        borderRadius: 12,
    },
    recurringInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    recurringTitle: {
        fontSize: 15,
        fontWeight: '600',
    },
    recurringSubtitle: {
        fontSize: 11,
        marginTop: 2,
    }
});
