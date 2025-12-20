import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { TextInput, Button, Icon } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as DocumentPicker from 'expo-document-picker';

import { useHomeContext } from '../../context/HomeContext';
import { usePremium } from '../../context/PremiumContext';
import { THEME_COLORS, useAppColors } from '../../utils/theme';

export default function SettingsScreen() {
    const router = useRouter();
    const COLORS = useAppColors();
    const { homeProfile, updateHomeProfile } = useHomeContext();
    const { isPremium, purchaseRemoveAds, restorePurchases } = usePremium();

    const [ownerName, setOwnerName] = useState('');
    const [title, setTitle] = useState('');
    const [address, setAddress] = useState('');
    const [themeColor, setThemeColor] = useState('orange');
    const [loading, setLoading] = useState(false);
    const [purchasePending, setPurchasePending] = useState(false);

    useEffect(() => {
        if (homeProfile) {
            setOwnerName(homeProfile.ownerName || '');
            setTitle(homeProfile.title || '');
            setAddress(homeProfile.address || '');
            setThemeColor(homeProfile.themeColor || 'orange');
        }
    }, [homeProfile]);

    const handleSave = async () => {
        if (!title) {
            Alert.alert('Eksik Bilgi', 'Lütfen en az "Ev Başlığı" giriniz.');
            return;
        }
        setLoading(true);
        try {
            await updateHomeProfile({ ownerName, title, address });
            Alert.alert('Başarılı', 'Ev ve profil bilgileri güncellendi.');
        } catch (error) {
            Alert.alert('Hata', 'Kaydedilirken bir sorun oluştu.');
        } finally {
            setLoading(false);
        }
    };

    // --- BACKUP FUNCTION ---
    const handleBackup = async () => {
        try {
            // Collect all data from AsyncStorage
            const keys = [
                '@home_profile',
                '@home_history',
                '@homes_list',
                '@current_home_id',
                '@home_xp',
                '@finance_transactions',
                '@finance_savings',
            ];

            const backupData = {};
            for (const key of keys) {
                const value = await AsyncStorage.getItem(key);
                if (value) {
                    backupData[key] = JSON.parse(value);
                }
            }

            // Add metadata
            backupData['_backup_date'] = new Date().toISOString();
            backupData['_app_version'] = '1.0.0';

            // Create JSON file
            const fileName = `dijital_cekmecem_yedek_${new Date().toISOString().split('T')[0]}.json`;
            const filePath = FileSystem.documentDirectory + fileName;

            await FileSystem.writeAsStringAsync(filePath, JSON.stringify(backupData, null, 2));

            // Share the file
            if (await Sharing.isAvailableAsync()) {
                await Sharing.shareAsync(filePath, {
                    mimeType: 'application/json',
                    dialogTitle: 'Yedeği Kaydet veya Paylaş',
                });
            } else {
                Alert.alert('Hata', 'Paylaşım bu cihazda desteklenmiyor.');
            }
        } catch (error) {
            console.error('Backup error:', error);
            Alert.alert('Hata', 'Yedekleme sırasında bir hata oluştu.');
        }
    };
    // --- BACKUP VALIDATION HELPERS ---
    const MAX_STRING_LENGTH = 10000; // Max 10KB per string field
    const MAX_ARRAY_LENGTH = 5000; // Max 5000 items per array
    const ALLOWED_KEYS = [
        '@home_profile', '@home_history', '@homes_list', '@home_homes',
        '@current_home_id', '@home_selected_id', '@home_xp',
        '@finance_transactions', '@finance_savings',
        '_backup_date', '_app_version'
    ];

    const containsMaliciousContent = (str) => {
        if (typeof str !== 'string') return false;
        // Check for script injection attempts
        const dangerousPatterns = [
            /<script/i,
            /javascript:/i,
            /on\w+\s*=/i, // onClick, onLoad etc.
            /eval\s*\(/i,
            /Function\s*\(/i,
        ];
        return dangerousPatterns.some(pattern => pattern.test(str));
    };

    const validateStringField = (value, fieldName) => {
        if (value === null || value === undefined) return true;
        if (typeof value !== 'string') return true; // Non-strings are handled elsewhere

        if (value.length > MAX_STRING_LENGTH) {
            throw new Error(`Alan "${fieldName}" çok uzun (max ${MAX_STRING_LENGTH} karakter)`);
        }
        if (containsMaliciousContent(value)) {
            throw new Error(`Alan "${fieldName}" zararlı içerik barındırıyor`);
        }
        return true;
    };

    const validateObject = (obj, path = 'root') => {
        if (obj === null || obj === undefined) return true;

        if (Array.isArray(obj)) {
            if (obj.length > MAX_ARRAY_LENGTH) {
                throw new Error(`Dizi "${path}" çok fazla eleman içeriyor (max ${MAX_ARRAY_LENGTH})`);
            }
            obj.forEach((item, index) => validateObject(item, `${path}[${index}]`));
        } else if (typeof obj === 'object') {
            Object.keys(obj).forEach(key => {
                validateStringField(key, `${path}.key`);
                validateObject(obj[key], `${path}.${key}`);
            });
        } else if (typeof obj === 'string') {
            validateStringField(obj, path);
        }
        return true;
    };

    const validateBackupSchema = (backupData) => {
        // 1. Check if it's a valid object
        if (!backupData || typeof backupData !== 'object') {
            throw new Error('Yedek verisi geçersiz format');
        }

        // 2. Check for backup metadata
        if (!backupData['_backup_date']) {
            throw new Error('Yedek dosyası meta verisi eksik (_backup_date)');
        }

        // 3. Validate backup date format
        const backupDate = new Date(backupData['_backup_date']);
        if (isNaN(backupDate.getTime())) {
            throw new Error('Yedek tarihi geçersiz format');
        }

        // 4. Check for unexpected keys
        const backupKeys = Object.keys(backupData);
        const unexpectedKeys = backupKeys.filter(key => !ALLOWED_KEYS.includes(key));
        if (unexpectedKeys.length > 0) {
            throw new Error(`Beklenmeyen alanlar tespit edildi: ${unexpectedKeys.join(', ')}`);
        }

        // 5. Validate homes structure
        const homes = backupData['@home_homes'] || backupData['@homes_list'];
        if (homes) {
            if (!Array.isArray(homes)) {
                throw new Error('@home_homes bir dizi olmalı');
            }
            homes.forEach((home, i) => {
                if (!home.id || typeof home.id !== 'number') {
                    throw new Error(`Ev #${i + 1} geçersiz ID`);
                }
                validateObject(home, `homes[${i}]`);
            });
        }

        // 6. Validate history structure
        const history = backupData['@home_history'];
        if (history) {
            if (!Array.isArray(history)) {
                throw new Error('@home_history bir dizi olmalı');
            }
            history.forEach((record, i) => {
                if (!record.id) {
                    throw new Error(`Kayıt #${i + 1} ID eksik`);
                }
                validateObject(record, `history[${i}]`);
            });
        }

        // 7. Validate transactions structure
        const transactions = backupData['@finance_transactions'];
        if (transactions) {
            if (!Array.isArray(transactions)) {
                throw new Error('@finance_transactions bir dizi olmalı');
            }
            transactions.forEach((trans, i) => {
                if (!trans.id) {
                    throw new Error(`İşlem #${i + 1} ID eksik`);
                }
                if (trans.amount !== undefined && typeof trans.amount !== 'number') {
                    throw new Error(`İşlem #${i + 1} tutar geçersiz`);
                }
                validateObject(trans, `transactions[${i}]`);
            });
        }

        // 8. Validate savings structure
        const savings = backupData['@finance_savings'];
        if (savings) {
            if (!Array.isArray(savings)) {
                throw new Error('@finance_savings bir dizi olmalı');
            }
            savings.forEach((goal, i) => {
                validateObject(goal, `savings[${i}]`);
            });
        }

        // 9. Deep validate all content for malicious strings
        validateObject(backupData);

        return true;
    };

    // --- RESTORE FUNCTION ---
    const handleRestore = async () => {
        Alert.alert(
            'Yedeği Geri Yükle',
            'Bu işlem mevcut verilerinizin üzerine yazacaktır. Devam etmek istiyor musunuz?',
            [
                { text: 'Vazgeç', style: 'cancel' },
                {
                    text: 'Devam Et',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            const result = await DocumentPicker.getDocumentAsync({
                                type: 'application/json',
                                copyToCacheDirectory: true,
                            });

                            if (result.canceled || !result.assets || result.assets.length === 0) {
                                return;
                            }

                            const fileUri = result.assets[0].uri;

                            // Read file with size limit check
                            const fileInfo = await FileSystem.getInfoAsync(fileUri);
                            if (fileInfo.size > 10 * 1024 * 1024) { // 10MB limit
                                Alert.alert('Hata', 'Dosya çok büyük (max 10MB)');
                                return;
                            }

                            let fileContent;
                            try {
                                fileContent = await FileSystem.readAsStringAsync(fileUri);
                            } catch (readError) {
                                Alert.alert('Hata', 'Dosya okunamadı');
                                return;
                            }

                            let backupData;
                            try {
                                backupData = JSON.parse(fileContent);
                            } catch (parseError) {
                                Alert.alert('Hata', 'Geçersiz JSON formatı');
                                return;
                            }

                            // Run comprehensive validation
                            try {
                                validateBackupSchema(backupData);
                            } catch (validationError) {
                                Alert.alert('Geçersiz Yedek Dosyası', validationError.message);
                                return;
                            }

                            // Restore each key
                            const keysToRestore = [
                                '@home_profile', '@home_history', '@home_homes',
                                '@home_selected_id', '@home_xp',
                                '@finance_transactions', '@finance_savings',
                            ];

                            for (const key of keysToRestore) {
                                if (backupData[key] !== undefined) {
                                    await AsyncStorage.setItem(key, JSON.stringify(backupData[key]));
                                }
                            }

                            Alert.alert(
                                'Başarılı',
                                'Veriler başarıyla geri yüklendi. Uygulama yeniden başlatılmalıdır.',
                                [{ text: 'Tamam' }]
                            );
                        } catch (error) {
                            console.error('Restore error:', error);
                            Alert.alert('Hata', 'Beklenmeyen bir hata oluştu. Lütfen tekrar deneyin.');
                        }
                    }
                }
            ]
        );
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: COLORS.background }]} edges={['top', 'left', 'right']}>
            <View style={[styles.header, { backgroundColor: COLORS.surface }]}>
                <View style={{ width: 44 }} />
                <Text style={styles.headerTitle}>Ayarlar</Text>
                <View style={{ width: 44 }} />
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                {/* THEME COLOR */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Tema Rengi</Text>
                    <View style={styles.colorPickerRow}>
                        {THEME_COLORS.map((theme) => (
                            <TouchableOpacity
                                key={theme.id}
                                style={[styles.colorOption, { backgroundColor: theme.color }, themeColor === theme.id && styles.colorOptionSelected]}
                                onPress={async () => {
                                    setThemeColor(theme.id);
                                    await updateHomeProfile({ themeColor: theme.id });
                                }}
                            >
                                {themeColor === theme.id && <Icon source="check" size={20} color="white" />}
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                {/* PREMIUM */}
                <View style={[styles.section, { backgroundColor: COLORS.surface }]}>
                    <Text style={[styles.sectionTitle, { color: COLORS.textDark }]}>Premium</Text>

                    {isPremium ? (
                        <View style={styles.premiumActiveRow}>
                            <View style={[styles.actionIcon, { backgroundColor: '#10b98120' }]}>
                                <MaterialCommunityIcons name="crown" size={22} color="#10b981" />
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={[styles.actionLabel, { color: '#10b981' }]}>Premium Aktif</Text>
                                <Text style={[styles.actionSubtitle, { color: COLORS.textGray }]}>Reklamsız deneyimin keyfini çıkar!</Text>
                            </View>
                            <MaterialCommunityIcons name="check-circle" size={24} color="#10b981" />
                        </View>
                    ) : (
                        <>
                            <TouchableOpacity
                                style={styles.actionRow}
                                onPress={async () => {
                                    setPurchasePending(true);
                                    await purchaseRemoveAds();
                                    setPurchasePending(false);
                                }}
                                disabled={purchasePending}
                            >
                                <View style={[styles.actionIcon, { backgroundColor: '#f59e0b20' }]}>
                                    <MaterialCommunityIcons name="crown" size={22} color="#f59e0b" />
                                </View>
                                <View style={{ flex: 1 }}>
                                    <Text style={[styles.actionLabel, { color: COLORS.textDark }]}>Reklamları Kaldır</Text>
                                    <Text style={[styles.actionSubtitle, { color: COLORS.textGray }]}>Tek seferlik ödeme ile reklamsız kullan</Text>
                                </View>
                                {purchasePending ? (
                                    <ActivityIndicator size="small" color={COLORS.primary} />
                                ) : (
                                    <MaterialCommunityIcons name="chevron-right" size={24} color={COLORS.textGray} />
                                )}
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={styles.actionRow}
                                onPress={async () => {
                                    setPurchasePending(true);
                                    await restorePurchases();
                                    setPurchasePending(false);
                                }}
                                disabled={purchasePending}
                            >
                                <View style={[styles.actionIcon, { backgroundColor: '#3b82f620' }]}>
                                    <MaterialCommunityIcons name="restore" size={22} color="#3b82f6" />
                                </View>
                                <View style={{ flex: 1 }}>
                                    <Text style={[styles.actionLabel, { color: COLORS.textDark }]}>Satın Alımları Geri Yükle</Text>
                                    <Text style={[styles.actionSubtitle, { color: COLORS.textGray }]}>Daha önce satın aldıysan geri yükle</Text>
                                </View>
                                <MaterialCommunityIcons name="chevron-right" size={24} color={COLORS.textGray} />
                            </TouchableOpacity>
                        </>
                    )}
                </View>

                {/* BACKUP & RESTORE */}
                <View style={[styles.section, { backgroundColor: COLORS.surface }]}>
                    <Text style={[styles.sectionTitle, { color: COLORS.textDark }]}>Veri Yönetimi</Text>

                    <TouchableOpacity style={styles.actionRow} onPress={handleBackup}>
                        <View style={[styles.actionIcon, { backgroundColor: '#3b82f620' }]}>
                            <MaterialCommunityIcons name="cloud-upload" size={22} color="#3b82f6" />
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={[styles.actionLabel, { color: COLORS.textDark }]}>Verileri Yedekle</Text>
                            <Text style={[styles.actionSubtitle, { color: COLORS.textGray }]}>JSON dosyası olarak dışa aktar</Text>
                        </View>
                        <MaterialCommunityIcons name="chevron-right" size={24} color={COLORS.textGray} />
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.actionRow} onPress={handleRestore}>
                        <View style={[styles.actionIcon, { backgroundColor: '#f59e0b20' }]}>
                            <MaterialCommunityIcons name="cloud-download" size={22} color="#f59e0b" />
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={[styles.actionLabel, { color: COLORS.textDark }]}>Yedeği Geri Yükle</Text>
                            <Text style={[styles.actionSubtitle, { color: COLORS.textGray }]}>JSON dosyasından içeri aktar</Text>
                        </View>
                        <MaterialCommunityIcons name="chevron-right" size={24} color={COLORS.textGray} />
                    </TouchableOpacity>
                </View>

                {/* HOME INFO */}
                <View style={[styles.section, { backgroundColor: COLORS.surface }]}>
                    <Text style={styles.sectionTitle}>Ev Bilgileri</Text>
                    <TextInput label="Ev Başlığı" value={title} onChangeText={setTitle} mode="outlined" style={[styles.input, { backgroundColor: COLORS.surface }]} outlineColor={COLORS.border} activeOutlineColor={COLORS.primary} textColor={COLORS.textDark} />
                    <TextInput label="Kullanıcı Adı" value={ownerName} onChangeText={setOwnerName} mode="outlined" style={[styles.input, { backgroundColor: COLORS.surface }]} outlineColor={COLORS.border} activeOutlineColor={COLORS.primary} textColor={COLORS.textDark} />
                    <TextInput label="Açık Adres" value={address} onChangeText={setAddress} mode="outlined" multiline numberOfLines={3} style={[styles.input, { minHeight: 80, backgroundColor: COLORS.surface }]} outlineColor={COLORS.border} activeOutlineColor={COLORS.primary} textColor={COLORS.textDark} />
                </View>

                <Button mode="contained" onPress={handleSave} style={styles.saveButton} contentStyle={{ height: 50 }} loading={loading} disabled={loading} buttonColor={COLORS.primary}>Kaydet</Button>
                <View style={{ height: 100 }} />
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1 },
    headerTitle: { fontSize: 18, fontWeight: '700' },
    content: { padding: 24, paddingBottom: 120 },
    section: { marginBottom: 24, gap: 12, borderRadius: 16, padding: 16 },
    sectionTitle: { fontSize: 16, fontWeight: '600', marginBottom: 8 },
    input: { marginBottom: 12 },
    saveButton: { borderRadius: 8, marginTop: 16 },
    colorPickerRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 12 },
    colorOption: { flex: 1, height: 56, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
    colorOptionSelected: { borderWidth: 3, borderColor: 'white', elevation: 5 },
    actionRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#f1f5f9',
    },
    actionIcon: {
        width: 44,
        height: 44,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    actionLabel: {
        fontSize: 15,
        fontWeight: '600',
    },
    actionSubtitle: {
        fontSize: 12,
        marginTop: 2,
    },
    premiumActiveRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        backgroundColor: '#10b98110',
        borderRadius: 12,
        paddingHorizontal: 12,
    },
});
