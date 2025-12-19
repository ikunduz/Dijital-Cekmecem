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
import { IconButton } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';

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
    const [saving, setSaving] = useState(false);

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
            }, currentHomeId);

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
                </ScrollView>
            </KeyboardAvoidingView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
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
        backgroundColor: COLORS.white,
        borderRadius: 16,
        padding: 6,
        marginBottom: 24,
    },
    toggleButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        borderRadius: 12,
        gap: 8,
    },
    toggleButtonActiveIncome: {
        backgroundColor: COLORS.income,
    },
    toggleButtonActiveExpense: {
        backgroundColor: COLORS.expense,
    },
    toggleText: {
        fontSize: 15,
        fontWeight: '600',
        color: COLORS.textGray,
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
        color: COLORS.textGray,
        marginBottom: 8,
    },
    amountInputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    amountInput: {
        fontSize: 48,
        fontWeight: '700',
        color: COLORS.textDark,
        textAlign: 'center',
        minWidth: 120,
    },
    currencySymbol: {
        fontSize: 32,
        fontWeight: '600',
        color: COLORS.textGray,
        marginLeft: 4,
    },
    section: {
        marginHorizontal: 16,
        marginBottom: 24,
    },
    sectionLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: COLORS.textDark,
        marginBottom: 12,
    },
    categoryGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10,
    },
    categoryItem: {
        width: '30%',
        backgroundColor: COLORS.white,
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
        color: COLORS.textDark,
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
        backgroundColor: COLORS.white,
        borderRadius: 12,
        padding: 16,
        gap: 12,
    },
    dateText: {
        fontSize: 16,
        color: COLORS.textDark,
        fontWeight: '500',
    },
    descriptionInput: {
        backgroundColor: COLORS.white,
        borderRadius: 12,
        padding: 16,
        fontSize: 15,
        color: COLORS.textDark,
        minHeight: 80,
        textAlignVertical: 'top',
    },
});
