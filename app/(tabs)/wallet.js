import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions, Alert } from 'react-native';

import { SafeAreaView } from 'react-native-safe-area-context';
import { FAB, IconButton } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { useHomeContext } from '../../context/HomeContext';
import { useFinanceContext } from '../../context/FinanceContext';
import { BannerAdComponent, showInterstitialIfQualified } from '../../components/Ads';
import { useAppColors } from '../../utils/theme';

const { width } = Dimensions.get('window');



const MONTHS_TR = [
    'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
    'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'
];

export default function WalletScreen() {
    const router = useRouter();
    const COLORS = useAppColors();
    const { currentHomeId } = useHomeContext();
    const {
        getMonthlyStats,
        getTotalBalance,
        getCategoryBreakdown,
        getRecentTransactions,
        getMonthlyTrend,
        EXPENSE_CATEGORIES,
        transactions,
        completeTransaction,
    } = useFinanceContext();

    const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

    const stats = useMemo(() => getMonthlyStats(currentHomeId, selectedMonth, selectedYear), [getMonthlyStats, currentHomeId, selectedMonth, selectedYear, transactions]);
    const totalBalance = useMemo(() => getTotalBalance(currentHomeId), [getTotalBalance, currentHomeId, transactions]);
    const categoryBreakdown = useMemo(() => getCategoryBreakdown(currentHomeId, 'expense', selectedMonth, selectedYear), [getCategoryBreakdown, currentHomeId, selectedMonth, selectedYear, transactions]);
    const trend = useMemo(() => getMonthlyTrend(currentHomeId, 6), [getMonthlyTrend, currentHomeId, transactions]);

    const upcomingPayments = useMemo(() => {
        const now = new Date();
        const threeDaysLater = new Date(now);
        threeDaysLater.setDate(threeDaysLater.getDate() + 3);

        return transactions.filter(t => {
            if (t.status !== 'pending') return false;
            if (currentHomeId && String(t.homeId) !== String(currentHomeId)) return false;

            // Parse date dd.mm.yyyy
            const parts = t.date.split('.');
            const paymentDate = new Date(parts[2], parts[1] - 1, parts[0]);

            // Only show if payment is due within next 3 days (or overdue)
            return paymentDate <= threeDaysLater;
        }).sort((a, b) => {
            const da = a.date.split('.').reverse().join('');
            const db = b.date.split('.').reverse().join('');
            return da.localeCompare(db);
        });
    }, [transactions, currentHomeId]);

    const completedPayments = useMemo(() => {
        return transactions.filter(t =>
            t.status !== 'pending' &&
            (!currentHomeId || String(t.homeId) === String(currentHomeId))
        ).slice(0, 20); // Show last 20 completed
    }, [transactions, currentHomeId]);

    const categoryData = useMemo(() => {
        const total = Object.values(categoryBreakdown).reduce((s, v) => s + v, 0);
        if (total === 0) return [];
        return EXPENSE_CATEGORIES
            .filter(cat => categoryBreakdown[cat.id])
            .map(cat => ({ ...cat, amount: categoryBreakdown[cat.id], percentage: Math.round((categoryBreakdown[cat.id] / total) * 100) }))
            .sort((a, b) => b.amount - a.amount);
    }, [categoryBreakdown]);

    const goToPrevMonth = () => {
        if (selectedMonth === 0) { setSelectedMonth(11); setSelectedYear(selectedYear - 1); }
        else { setSelectedMonth(selectedMonth - 1); }
    };

    const goToNextMonth = () => {
        const now = new Date();
        if (selectedMonth === now.getMonth() && selectedYear === now.getFullYear()) return;
        if (selectedMonth === 11) { setSelectedMonth(0); setSelectedYear(selectedYear + 1); }
        else { setSelectedMonth(selectedMonth + 1); }
    };

    const handleComplete = (id) => {
        Alert.alert(
            "Ödeme Tamamlandı",
            "Bu işlemi tamamlanmış olarak işaretlemek istiyor musunuz?",
            [
                { text: "Vazgeç", style: "cancel" },
                { text: "Evet, Ödendi", onPress: () => completeTransaction(id) }
            ]
        );
    };

    const formatCurrency = (amount) => new Intl.NumberFormat('tr-TR', { style: 'decimal', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(amount) + ' ₺';

    return (
        <View style={[styles.container, { backgroundColor: COLORS.background }]}>
            <LinearGradient colors={['#FF9800', '#F57C00']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.header}>
                <SafeAreaView edges={['top']}>
                    <View style={styles.headerRow}>
                        <View style={{ width: 44 }} />
                        <Text style={styles.headerTitle}>Cüzdan</Text>
                        <View style={{ width: 44 }} />
                    </View>

                    <View style={styles.balanceSummary}>
                        <View style={styles.balanceItem}>
                            <Text style={styles.balanceLabel}>Mevcut Bakiye</Text>
                            <Text style={[styles.balanceValue, { color: stats.balance >= 0 ? '#a7f3d0' : '#fecaca' }]}>{formatCurrency(stats.balance)}</Text>
                        </View>
                    </View>

                    <View style={styles.incomeExpenseRow}>
                        <View style={styles.incomeExpenseItem}>
                            <MaterialCommunityIcons name="arrow-up-circle" size={18} color="#a7f3d0" />
                            <Text style={styles.incomeExpenseLabel}>Gelir</Text>
                            <Text style={styles.incomeExpenseValue}>{formatCurrency(stats.income)}</Text>
                        </View>
                        <View style={styles.incomeExpenseDivider} />
                        <View style={styles.incomeExpenseItem}>
                            <MaterialCommunityIcons name="arrow-down-circle" size={18} color="#fecaca" />
                            <Text style={styles.incomeExpenseLabel}>Gider</Text>
                            <Text style={styles.incomeExpenseValue}>{formatCurrency(stats.expense)}</Text>
                        </View>
                    </View>

                    <View style={styles.monthSelector}>
                        <TouchableOpacity onPress={goToPrevMonth}><MaterialCommunityIcons name="chevron-left" size={24} color="white" /></TouchableOpacity>
                        <Text style={styles.monthText}>{MONTHS_TR[selectedMonth]} {selectedYear}</Text>
                        <TouchableOpacity onPress={goToNextMonth}><MaterialCommunityIcons name="chevron-right" size={24} color="rgba(255,255,255,0.5)" /></TouchableOpacity>
                    </View>
                </SafeAreaView>
            </LinearGradient>

            <ScrollView style={styles.content} contentContainerStyle={{ paddingBottom: 100 }}>
                {/* UPCOMING PAYMENTS */}
                <View style={[styles.section, { backgroundColor: COLORS.surface }]}>
                    <Text style={[styles.sectionTitle, { color: COLORS.danger }]}>Yaklaşan Ödemeler</Text>
                    {upcomingPayments.length === 0 ? (
                        <View style={styles.emptyState}>
                            <MaterialCommunityIcons name="calendar-check" size={40} color={COLORS.textGray} />
                            <Text style={[styles.emptyText, { color: COLORS.textGray }]}>Bekleyen ödeme bulunmuyor</Text>
                        </View>
                    ) : (
                        upcomingPayments.map((trans) => (
                            <TouchableOpacity
                                key={trans.id}
                                style={[styles.transactionRow, styles.upcomingRow]}
                                onPress={() => handleComplete(trans.id)}
                            >
                                <View style={[styles.transactionIcon, { backgroundColor: COLORS.expense + '15' }]}>
                                    <MaterialCommunityIcons name="clock-outline" size={20} color={COLORS.expense} />
                                </View>
                                <View style={styles.transactionInfo}>
                                    <Text style={[styles.transactionLabel, { color: COLORS.textDark }]}>{trans.description || 'Fatura/Gider'}</Text>
                                    <Text style={[styles.transactionDate, { color: COLORS.textGray }]}>{trans.date}</Text>
                                </View>
                                <View style={{ alignItems: 'flex-end' }}>
                                    <Text style={[styles.transactionAmount, { color: COLORS.danger }]}>-{formatCurrency(trans.amount)}</Text>
                                    <View style={[styles.payBadge, { backgroundColor: COLORS.danger }]}><Text style={styles.payBadgeText}>Öde</Text></View>
                                </View>
                            </TouchableOpacity>
                        ))
                    )}
                </View>

                {/* COMPLETED PAYMENTS */}
                <View style={[styles.section, { marginTop: 0, backgroundColor: COLORS.surface }]}>
                    <Text style={[styles.sectionTitle, { color: COLORS.success }]}>Tamamlananlar</Text>
                    {completedPayments.length === 0 ? (
                        <View style={styles.emptyState}>
                            <MaterialCommunityIcons name="receipt" size={40} color={COLORS.textGray} />
                            <Text style={[styles.emptyText, { color: COLORS.textGray }]}>Henüz işlem yok</Text>
                        </View>
                    ) : (
                        completedPayments.map((trans) => {
                            const isIncome = trans.type === 'income';
                            return (
                                <View key={trans.id} style={[styles.transactionRow, { borderBottomColor: COLORS.border }]}>
                                    <View style={[styles.transactionIcon, { backgroundColor: isIncome ? `${COLORS.success}20` : `${COLORS.danger}20` }]}>
                                        <MaterialCommunityIcons name={isIncome ? 'plus' : 'minus'} size={20} color={isIncome ? COLORS.success : COLORS.danger} />
                                    </View>
                                    <View style={styles.transactionInfo}>
                                        <Text style={[styles.transactionLabel, { color: COLORS.textDark }]}>{trans.description || 'İşlem'}</Text>
                                        <Text style={[styles.transactionDate, { color: COLORS.textGray }]}>{trans.date}</Text>
                                    </View>
                                    <Text style={[styles.transactionAmount, { color: isIncome ? COLORS.success : COLORS.danger }]}>
                                        {isIncome ? '+' : '-'}{formatCurrency(trans.amount)}
                                    </Text>
                                </View>
                            );
                        })
                    )}
                </View>

                {/* CATEGORY BREAKDOWN */}
                {categoryData.length > 0 && (
                    <View style={[styles.section, { backgroundColor: COLORS.surface }]}>
                        <Text style={[styles.sectionTitle, { color: COLORS.textDark }]}>Harcama Dağılımı</Text>
                        {categoryData.slice(0, 5).map((cat) => (
                            <View key={cat.id} style={styles.categoryRow}>
                                <View style={[styles.categoryIcon, { backgroundColor: cat.color + '20' }]}>
                                    <MaterialCommunityIcons name={cat.icon} size={18} color={cat.color} />
                                </View>
                                <Text style={[styles.categoryLabel, { color: COLORS.textDark }]}>{cat.label}</Text>
                                <Text style={[styles.categoryAmount, { color: COLORS.textDark }]}>{formatCurrency(cat.amount)}</Text>
                                <Text style={[styles.categoryPercent, { color: COLORS.textGray }]}>%{cat.percentage}</Text>
                            </View>
                        ))}
                    </View>
                )}
                <BannerAdComponent />
            </ScrollView>

            <FAB icon="plus" color="white" style={styles.fab} onPress={() => router.push('/add-transaction')} />
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: { paddingBottom: 20, borderBottomLeftRadius: 24, borderBottomRightRadius: 24 },
    headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16 },
    headerTitle: { fontSize: 20, fontWeight: '700', color: 'white' },
    monthSelector: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 20, marginTop: 8 },
    monthText: { fontSize: 18, fontWeight: '600', color: 'white', minWidth: 140, textAlign: 'center' },
    content: { flex: 1, paddingTop: 10 },
    balanceSummary: {
        flexDirection: 'row',
        paddingHorizontal: 24,
        marginTop: 16,
        marginBottom: 8,
        alignItems: 'center',
    },
    balanceItem: {
        flex: 1,
    },
    balanceLabel: {
        fontSize: 12,
        color: 'rgba(255,255,255,0.8)',
        fontWeight: '500',
        marginBottom: 4,
    },
    balanceValue: {
        fontSize: 32,
        fontWeight: '800',
        color: 'white',
    },
    incomeExpenseRow: {
        flexDirection: 'row',
        marginHorizontal: 24,
        marginBottom: 12,
    },
    incomeExpenseItem: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    incomeExpenseLabel: {
        fontSize: 12,
        color: 'rgba(255,255,255,0.7)',
        fontWeight: '500',
    },
    incomeExpenseValue: {
        fontSize: 14,
        color: 'white',
        fontWeight: '700',
    },
    incomeExpenseDivider: {
        width: 1,
        height: 20,
        backgroundColor: 'rgba(255,255,255,0.2)',
        marginHorizontal: 12,
    },
    section: { marginHorizontal: 16, marginBottom: 16, borderRadius: 20, padding: 16, elevation: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 8 },
    sectionTitle: { fontSize: 17, fontWeight: '800', marginBottom: 16 },
    transactionRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
    upcomingRow: { backgroundColor: '#fff1f2', marginHorizontal: -8, paddingHorizontal: 8, borderRadius: 12, borderBottomWidth: 0, marginBottom: 8 },
    transactionIcon: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
    transactionInfo: { flex: 1 },
    transactionLabel: { fontSize: 15, fontWeight: '600' },
    transactionDate: { fontSize: 12, marginTop: 2 },
    transactionAmount: { fontSize: 16, fontWeight: '700' },
    payBadge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 8,
        marginTop: 4
    },
    payBadgeText: { color: 'white', fontSize: 11, fontWeight: '800' },
    categoryRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#f1f5f9',
    },
    categoryIcon: {
        width: 32,
        height: 32,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 10,
    },
    categoryLabel: { flex: 1, fontSize: 14, fontWeight: '500' },
    categoryAmount: { fontSize: 14, fontWeight: '600', marginRight: 8 },
    categoryPercent: { fontSize: 12, fontWeight: '500', minWidth: 35, textAlign: 'right' },
    emptyState: { alignItems: 'center', paddingVertical: 32 },
    emptyText: { fontSize: 14, marginTop: 8, fontWeight: '500' },
    fab: { position: 'absolute', right: 20, bottom: 24, borderRadius: 16, backgroundColor: '#F57C00' },
});
