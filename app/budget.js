import React, { useMemo, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FAB, IconButton } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { useHomeContext } from '../context/HomeContext';
import { useFinanceContext, EXPENSE_CATEGORIES } from '../context/FinanceContext';

const { width } = Dimensions.get('window');

const COLORS = {
    primary: '#F57C00',
    background: '#F0F2F5',
    white: '#FFFFFF',
    textDark: '#0f172a',
    textGray: '#647487',
    income: '#22c55e',
    expense: '#ef4444',
    balance: '#3b82f6',
};

const MONTHS_TR = [
    'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
    'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'
];

export default function BudgetScreen() {
    const router = useRouter();
    const { currentHomeId } = useHomeContext();
    const {
        getMonthlyStats,
        getCategoryBreakdown,
        getRecentTransactions,
        getMonthlyTrend,
        EXPENSE_CATEGORIES,
    } = useFinanceContext();

    const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

    // --- COMPUTED DATA ---
    const stats = useMemo(() => {
        return getMonthlyStats(currentHomeId, selectedMonth, selectedYear);
    }, [getMonthlyStats, currentHomeId, selectedMonth, selectedYear]);

    const categoryBreakdown = useMemo(() => {
        return getCategoryBreakdown(currentHomeId, 'expense', selectedMonth, selectedYear);
    }, [getCategoryBreakdown, currentHomeId, selectedMonth, selectedYear]);

    const recentTransactions = useMemo(() => {
        return getRecentTransactions(currentHomeId, 5);
    }, [getRecentTransactions, currentHomeId]);

    const trend = useMemo(() => {
        return getMonthlyTrend(currentHomeId, 6);
    }, [getMonthlyTrend, currentHomeId]);

    // --- CATEGORY BREAKDOWN DATA ---
    const categoryData = useMemo(() => {
        const total = Object.values(categoryBreakdown).reduce((s, v) => s + v, 0);
        if (total === 0) return [];

        return EXPENSE_CATEGORIES
            .filter(cat => categoryBreakdown[cat.id])
            .map(cat => ({
                ...cat,
                amount: categoryBreakdown[cat.id],
                percentage: Math.round((categoryBreakdown[cat.id] / total) * 100),
            }))
            .sort((a, b) => b.amount - a.amount);
    }, [categoryBreakdown]);

    // --- MONTH NAVIGATION ---
    const goToPrevMonth = () => {
        if (selectedMonth === 0) {
            setSelectedMonth(11);
            setSelectedYear(selectedYear - 1);
        } else {
            setSelectedMonth(selectedMonth - 1);
        }
    };

    const goToNextMonth = () => {
        const now = new Date();
        if (selectedMonth === now.getMonth() && selectedYear === now.getFullYear()) return;

        if (selectedMonth === 11) {
            setSelectedMonth(0);
            setSelectedYear(selectedYear + 1);
        } else {
            setSelectedMonth(selectedMonth + 1);
        }
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('tr-TR', {
            style: 'decimal',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(amount) + ' ₺';
    };

    return (
        <View style={styles.container}>
            {/* HEADER */}
            <LinearGradient
                colors={['#FF9800', '#F57C00']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.header}
            >
                <SafeAreaView edges={['top']}>
                    <View style={styles.headerRow}>
                        <TouchableOpacity onPress={() => router.back()}>
                            <IconButton icon="arrow-left" size={24} iconColor="white" />
                        </TouchableOpacity>
                        <Text style={styles.headerTitle}>Bütçem</Text>
                        <TouchableOpacity onPress={() => router.push('/savings')}>
                            <IconButton icon="piggy-bank" size={24} iconColor="white" />
                        </TouchableOpacity>
                    </View>

                    {/* Month Selector */}
                    <View style={styles.monthSelector}>
                        <TouchableOpacity onPress={goToPrevMonth}>
                            <MaterialCommunityIcons name="chevron-left" size={28} color="white" />
                        </TouchableOpacity>
                        <Text style={styles.monthText}>
                            {MONTHS_TR[selectedMonth]} {selectedYear}
                        </Text>
                        <TouchableOpacity onPress={goToNextMonth}>
                            <MaterialCommunityIcons name="chevron-right" size={28} color="rgba(255,255,255,0.5)" />
                        </TouchableOpacity>
                    </View>
                </SafeAreaView>
            </LinearGradient>

            <ScrollView style={styles.content} contentContainerStyle={{ paddingBottom: 100 }}>
                {/* SUMMARY CARDS */}
                <View style={styles.summaryContainer}>
                    <View style={[styles.summaryCard, { borderLeftColor: COLORS.income }]}>
                        <Text style={styles.summaryLabel}>Gelir</Text>
                        <Text style={[styles.summaryAmount, { color: COLORS.income }]}>
                            +{formatCurrency(stats.income)}
                        </Text>
                    </View>
                    <View style={[styles.summaryCard, { borderLeftColor: COLORS.expense }]}>
                        <Text style={styles.summaryLabel}>Gider</Text>
                        <Text style={[styles.summaryAmount, { color: COLORS.expense }]}>
                            -{formatCurrency(stats.expense)}
                        </Text>
                    </View>
                    <View style={[styles.summaryCard, { borderLeftColor: COLORS.balance }]}>
                        <Text style={styles.summaryLabel}>Kalan</Text>
                        <Text style={[styles.summaryAmount, { color: stats.balance >= 0 ? COLORS.income : COLORS.expense }]}>
                            {stats.balance >= 0 ? '+' : ''}{formatCurrency(stats.balance)}
                        </Text>
                    </View>
                </View>

                {/* MINI CHART - Simple Bar */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Son 6 Ay Trendi</Text>
                    <View style={styles.chartContainer}>
                        {trend.map((item, index) => {
                            const maxVal = Math.max(...trend.map(t => Math.max(t.income, t.expense))) || 1;
                            const incomeHeight = (item.income / maxVal) * 80;
                            const expenseHeight = (item.expense / maxVal) * 80;

                            return (
                                <View key={index} style={styles.chartColumn}>
                                    <View style={styles.barsWrapper}>
                                        <View style={[styles.bar, styles.incomeBar, { height: incomeHeight || 2 }]} />
                                        <View style={[styles.bar, styles.expenseBar, { height: expenseHeight || 2 }]} />
                                    </View>
                                    <Text style={styles.chartLabel}>{item.month}</Text>
                                </View>
                            );
                        })}
                    </View>
                    <View style={styles.legendRow}>
                        <View style={styles.legendItem}>
                            <View style={[styles.legendDot, { backgroundColor: COLORS.income }]} />
                            <Text style={styles.legendText}>Gelir</Text>
                        </View>
                        <View style={styles.legendItem}>
                            <View style={[styles.legendDot, { backgroundColor: COLORS.expense }]} />
                            <Text style={styles.legendText}>Gider</Text>
                        </View>
                    </View>
                </View>

                {/* CATEGORY BREAKDOWN */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Gider Dağılımı</Text>
                    {categoryData.length === 0 ? (
                        <View style={styles.emptyState}>
                            <MaterialCommunityIcons name="chart-pie" size={48} color="#cbd5e1" />
                            <Text style={styles.emptyText}>Bu ay henüz gider yok</Text>
                        </View>
                    ) : (
                        categoryData.map((cat, index) => (
                            <View key={cat.id} style={styles.categoryRow}>
                                <View style={[styles.categoryIcon, { backgroundColor: cat.color + '20' }]}>
                                    <MaterialCommunityIcons name={cat.icon} size={20} color={cat.color} />
                                </View>
                                <View style={styles.categoryInfo}>
                                    <Text style={styles.categoryLabel}>{cat.label}</Text>
                                    <View style={styles.progressBarBg}>
                                        <View
                                            style={[
                                                styles.progressBarFill,
                                                { width: `${cat.percentage}%`, backgroundColor: cat.color }
                                            ]}
                                        />
                                    </View>
                                </View>
                                <View style={styles.categoryAmountContainer}>
                                    <Text style={styles.categoryAmount}>{formatCurrency(cat.amount)}</Text>
                                    <Text style={styles.categoryPercent}>{cat.percentage}%</Text>
                                </View>
                            </View>
                        ))
                    )}
                </View>

                {/* RECENT TRANSACTIONS */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Son İşlemler</Text>
                    {recentTransactions.length === 0 ? (
                        <View style={styles.emptyState}>
                            <MaterialCommunityIcons name="receipt" size={48} color="#cbd5e1" />
                            <Text style={styles.emptyText}>Henüz işlem yok</Text>
                            <Text style={styles.emptySubtext}>+ butonuna basarak ekleyin</Text>
                        </View>
                    ) : (
                        recentTransactions.map((trans) => {
                            const allCats = [...EXPENSE_CATEGORIES, ...(require('../context/FinanceContext').INCOME_CATEGORIES || [])];
                            const cat = allCats.find(c => c.id === trans.category) || { icon: 'circle', color: '#6b7280', label: 'Diğer' };
                            const isIncome = trans.type === 'income';

                            return (
                                <TouchableOpacity key={trans.id} style={styles.transactionRow}>
                                    <View style={[styles.transactionIcon, { backgroundColor: cat.color + '20' }]}>
                                        <MaterialCommunityIcons name={cat.icon} size={20} color={cat.color} />
                                    </View>
                                    <View style={styles.transactionInfo}>
                                        <Text style={styles.transactionLabel}>{cat.label}</Text>
                                        <Text style={styles.transactionDate}>{trans.date}</Text>
                                    </View>
                                    <Text style={[
                                        styles.transactionAmount,
                                        { color: isIncome ? COLORS.income : COLORS.expense }
                                    ]}>
                                        {isIncome ? '+' : '-'}{formatCurrency(trans.amount)}
                                    </Text>
                                </TouchableOpacity>
                            );
                        })
                    )}
                </View>
            </ScrollView>

            {/* FAB */}
            <FAB
                icon="plus"
                color="white"
                style={styles.fab}
                onPress={() => router.push('/add-transaction')}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    header: {
        paddingBottom: 20,
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
        fontSize: 20,
        fontWeight: '700',
        color: 'white',
    },
    monthSelector: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 20,
        marginTop: 8,
    },
    monthText: {
        fontSize: 18,
        fontWeight: '600',
        color: 'white',
        minWidth: 140,
        textAlign: 'center',
    },
    content: {
        flex: 1,
        paddingTop: 20,
    },
    summaryContainer: {
        flexDirection: 'row',
        paddingHorizontal: 16,
        gap: 10,
        marginBottom: 24,
    },
    summaryCard: {
        flex: 1,
        backgroundColor: COLORS.white,
        borderRadius: 12,
        padding: 12,
        borderLeftWidth: 4,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    summaryLabel: {
        fontSize: 12,
        color: COLORS.textGray,
        marginBottom: 4,
    },
    summaryAmount: {
        fontSize: 16,
        fontWeight: '700',
    },
    section: {
        backgroundColor: COLORS.white,
        marginHorizontal: 16,
        marginBottom: 16,
        borderRadius: 16,
        padding: 16,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: COLORS.textDark,
        marginBottom: 16,
    },
    chartContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
        height: 100,
        paddingHorizontal: 8,
    },
    chartColumn: {
        alignItems: 'center',
        flex: 1,
    },
    barsWrapper: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        gap: 4,
        height: 80,
    },
    bar: {
        width: 12,
        borderRadius: 4,
        minHeight: 2,
    },
    incomeBar: {
        backgroundColor: COLORS.income,
    },
    expenseBar: {
        backgroundColor: COLORS.expense,
    },
    chartLabel: {
        fontSize: 10,
        color: COLORS.textGray,
        marginTop: 6,
    },
    legendRow: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 24,
        marginTop: 12,
    },
    legendItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    legendDot: {
        width: 10,
        height: 10,
        borderRadius: 5,
    },
    legendText: {
        fontSize: 12,
        color: COLORS.textGray,
    },
    categoryRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 14,
    },
    categoryIcon: {
        width: 36,
        height: 36,
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    categoryInfo: {
        flex: 1,
    },
    categoryLabel: {
        fontSize: 14,
        fontWeight: '500',
        color: COLORS.textDark,
        marginBottom: 6,
    },
    progressBarBg: {
        height: 6,
        backgroundColor: '#e2e8f0',
        borderRadius: 3,
        overflow: 'hidden',
    },
    progressBarFill: {
        height: '100%',
        borderRadius: 3,
    },
    categoryAmountContainer: {
        alignItems: 'flex-end',
        marginLeft: 12,
    },
    categoryAmount: {
        fontSize: 14,
        fontWeight: '600',
        color: COLORS.textDark,
    },
    categoryPercent: {
        fontSize: 11,
        color: COLORS.textGray,
    },
    transactionRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#f1f5f9',
    },
    transactionIcon: {
        width: 40,
        height: 40,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    transactionInfo: {
        flex: 1,
    },
    transactionLabel: {
        fontSize: 14,
        fontWeight: '500',
        color: COLORS.textDark,
    },
    transactionDate: {
        fontSize: 12,
        color: COLORS.textGray,
        marginTop: 2,
    },
    transactionAmount: {
        fontSize: 15,
        fontWeight: '700',
    },
    emptyState: {
        alignItems: 'center',
        paddingVertical: 24,
    },
    emptyText: {
        fontSize: 14,
        color: COLORS.textGray,
        marginTop: 8,
    },
    emptySubtext: {
        fontSize: 12,
        color: '#94a3b8',
        marginTop: 4,
    },
    fab: {
        position: 'absolute',
        right: 20,
        bottom: 24,
        backgroundColor: COLORS.primary,
        borderRadius: 16,
    },
});
