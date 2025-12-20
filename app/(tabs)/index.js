import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity, RefreshControl, Alert, Dimensions } from 'react-native';
import { FAB } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

import { useHomeContext } from '../../context/HomeContext';
import { useFinanceContext } from '../../context/FinanceContext';
import { THEME_COLOR_MAP, useAppColors } from '../../utils/theme';

const { width } = Dimensions.get('window');

export default function Dashboard() {
    const router = useRouter();
    const COLORS = useAppColors();
    const { history, homeProfile, xp } = useHomeContext();
    const { transactions, getMonthlyStats, savingsGoals } = useFinanceContext();
    const [refreshing, setRefreshing] = useState(false);

    const currentThemeColor = THEME_COLOR_MAP[homeProfile?.themeColor] || THEME_COLOR_MAP.orange;

    // --- GREETING ---
    const greeting = useMemo(() => {
        const hour = new Date().getHours();
        if (hour < 12) return "Günaydın";
        if (hour < 18) return "Tünaydın";
        return "İyi Akşamlar";
    }, []);

    // --- HOME HEALTH LOGIC ---
    const { healthScore, issues } = useMemo(() => {
        let score = 100;
        const foundIssues = [];
        const now = new Date();

        const bills = (transactions || []).filter(t => t.category === 'bill');
        if (bills.length > 0) {
            const parse = (d) => {
                if (!d) return new Date(0);
                const parts = d.split('.');
                return new Date(parts[2], parts[1] - 1, parts[0]);
            };
            const sortedBills = [...bills].sort((a, b) => parse(b.date) - parse(a.date));
            const diffDays = (now - parse(sortedBills[0].date)) / (1000 * 60 * 60 * 24);
            if (diffDays > 45) {
                score -= 10;
                foundIssues.push("Fatura gecikmesi olabilir");
            }
        }

        const warranties = history.filter(h => h.type === 'warranty');
        let expiredWarranties = 0;
        warranties.forEach(w => {
            const parts = w.date.split('.');
            const endDate = new Date(parts[2], parts[1] - 1, parts[0]);
            if (endDate < now) {
                score -= 5;
                expiredWarranties++;
            }
        });
        if (expiredWarranties > 0) foundIssues.push(`${expiredWarranties} garanti süresi doldu`);

        const docs = history.filter(h => h.type === 'doc' && (h.subType === 'dask' || h.subType === 'insurance'));
        docs.forEach(d => {
            const parts = d.date.split('.');
            const startDate = new Date(parts[2], parts[1] - 1, parts[0]);
            const endDate = new Date(startDate);
            endDate.setFullYear(endDate.getFullYear() + 1);
            if (endDate < now) {
                score -= 20;
                foundIssues.push("DASK/Sigorta süresi dolmuş");
            }
        });

        return { healthScore: Math.max(0, score), issues: foundIssues };
    }, [history, transactions]);

    // --- FINANCE STATS ---
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();

    const financeStats = useMemo(() => {
        const fStats = getMonthlyStats(homeProfile?.id, currentMonth, currentYear);
        return { balance: fStats.balance };
    }, [getMonthlyStats, homeProfile, currentMonth, currentYear]);

    // --- FINAL SCORE ---
    const { finalHealthScore, finalIssues } = useMemo(() => {
        let score = healthScore;
        const currentIssues = [...issues];
        if (financeStats.balance < 0) {
            score -= Math.min(30, Math.floor(Math.abs(financeStats.balance) / 100));
            currentIssues.push(`Bütçe ekside`);
        }
        return { finalHealthScore: Math.max(0, score), finalIssues: currentIssues };
    }, [healthScore, issues, financeStats.balance]);

    const handleStatusPress = () => {
        if (finalIssues.length === 0) {
            Alert.alert("Evin Durumu", "Her şey yolunda! ✨");
            return;
        }
        Alert.alert("Dikkat Edilecekler", finalIssues.map(i => `• ${i}`).join('\n'));
    };

    const onRefresh = React.useCallback(() => {
        setRefreshing(true);
        setTimeout(() => setRefreshing(false), 1000);
    }, []);

    // --- QUICK ACCESS ITEMS ---
    const quickActions = [
        { icon: 'receipt', label: 'Faturalar', color: '#3b82f6', route: '/bill-history' },
        { icon: 'shield-check', label: 'Garantiler', color: '#8b5cf6', route: '/folder-detail?category=Garantiler' },
        { icon: 'file-document', label: 'Evraklar', color: '#10b981', route: '/official-docs' },
        { icon: 'piggy-bank', label: 'Birikim', color: '#f59e0b', route: '/savings' },
    ];

    return (
        <View style={[styles.container, { backgroundColor: COLORS.background }]}>
            {/* HEADER */}
            <LinearGradient
                colors={[currentThemeColor, currentThemeColor + 'DD']}
                style={styles.header}
            >
                <SafeAreaView edges={['top']}>
                    <View style={styles.headerTop}>
                        <View>
                            <Text style={styles.greeting}>{greeting}</Text>
                            <Text style={styles.homeTitle}>{homeProfile?.ownerName || 'Kullanıcı'}</Text>
                        </View>
                        <TouchableOpacity onPress={() => router.push('/settings')}>
                            <View style={styles.avatarContainer}>
                                <MaterialCommunityIcons name="cog" size={24} color="white" />
                            </View>
                        </TouchableOpacity>
                    </View>
                </SafeAreaView>
            </LinearGradient>

            <ScrollView
                style={styles.content}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={currentThemeColor} />
                }
            >
                {/* STATUS CARD - Floating */}
                <TouchableOpacity
                    style={[styles.statusCard, { backgroundColor: COLORS.surface }]}
                    activeOpacity={0.9}
                    onPress={handleStatusPress}
                >
                    <View style={styles.statusLeft}>
                        <Text style={styles.statusLabel}>Ev Puanı</Text>
                        <View style={styles.scoreRow}>
                            <Text style={[styles.scoreNumber, { color: finalHealthScore >= 70 ? '#10b981' : '#ef4444' }]}>
                                {finalHealthScore}
                            </Text>
                            <Text style={styles.scoreMax}>/100</Text>
                        </View>
                        {finalIssues.length > 0 && (
                            <Text style={styles.issueHint}>{finalIssues.length} konu bekliyor</Text>
                        )}
                    </View>
                    <View style={[styles.statusIcon, { backgroundColor: finalHealthScore >= 70 ? '#10b98120' : '#ef444420' }]}>
                        <Text style={styles.statusEmoji}>
                            {finalHealthScore >= 90 ? '🏰' : finalHealthScore >= 70 ? '🏡' : finalHealthScore >= 50 ? '🏗️' : '🏚️'}
                        </Text>
                    </View>
                </TouchableOpacity>

                {/* BALANCE CARD */}
                <TouchableOpacity
                    style={[styles.balanceCard, { backgroundColor: COLORS.surface }]}
                    onPress={() => router.push('/wallet')}
                    activeOpacity={0.8}
                >
                    <View style={[styles.balanceIcon, { backgroundColor: currentThemeColor + '15' }]}>
                        <MaterialCommunityIcons name="wallet-outline" size={22} color={currentThemeColor} />
                    </View>
                    <View style={styles.balanceInfo}>
                        <Text style={[styles.balanceLabel, { color: COLORS.textGray }]}>Mevcut Bakiye</Text>
                        <Text style={[styles.balanceValue, { color: financeStats.balance >= 0 ? '#10b981' : '#ef4444' }]}>
                            {financeStats.balance >= 0 ? '+' : ''}{financeStats.balance.toLocaleString('tr-TR')} ₺
                        </Text>
                    </View>
                    <MaterialCommunityIcons name="chevron-right" size={22} color={COLORS.textGray} />
                </TouchableOpacity>

                {/* QUICK ACCESS */}
                <Text style={[styles.sectionTitle, { color: COLORS.textDark }]}>Çekmecelerim</Text>
                <View style={styles.quickGrid}>
                    {quickActions.map((action, index) => (
                        <TouchableOpacity
                            key={index}
                            style={[styles.quickItem, { backgroundColor: COLORS.surface }]}
                            onPress={() => {
                                const [pathname, query] = action.route.split('?');
                                const params = query ? Object.fromEntries(new URLSearchParams(query)) : {};
                                router.push({ pathname, params });
                            }}
                            activeOpacity={0.7}
                        >
                            <View style={[styles.quickIcon, { backgroundColor: action.color + '15' }]}>
                                <MaterialCommunityIcons name={action.icon} size={24} color={action.color} />
                            </View>
                            <Text style={[styles.quickLabel, { color: COLORS.textDark }]}>{action.label}</Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </ScrollView>

            <FAB
                icon="plus"
                color="white"
                style={[styles.fab, { backgroundColor: currentThemeColor }]}
                onPress={() => router.push('/add-record')}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: {
        paddingBottom: 60,
        borderBottomLeftRadius: 28,
        borderBottomRightRadius: 28,
    },
    headerTop: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingTop: 12,
        paddingBottom: 8,
    },
    greeting: { fontSize: 14, color: 'rgba(255,255,255,0.85)', fontWeight: '500' },
    homeTitle: { fontSize: 24, color: 'white', fontWeight: '800', marginTop: 2 },
    avatarContainer: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: 'rgba(255,255,255,0.2)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    content: { flex: 1, marginTop: -40 },
    scrollContent: { paddingHorizontal: 16, paddingBottom: 100 },

    // Status Card
    statusCard: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderRadius: 20,
        padding: 20,
        marginBottom: 12,
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
    },
    statusLeft: {},
    statusLabel: { fontSize: 13, fontWeight: '500', color: '#64748b', marginBottom: 4 },
    scoreRow: { flexDirection: 'row', alignItems: 'baseline' },
    scoreNumber: { fontSize: 36, fontWeight: '800' },
    scoreMax: { fontSize: 16, fontWeight: '600', color: '#94a3b8', marginLeft: 2 },
    issueHint: { fontSize: 12, color: '#f59e0b', marginTop: 4, fontWeight: '500' },
    statusIcon: {
        width: 64,
        height: 64,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
    },
    statusEmoji: { fontSize: 32 },

    // Balance Card
    balanceCard: {
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: 16,
        padding: 16,
        marginBottom: 24,
        elevation: 2,
    },
    balanceIcon: {
        width: 44,
        height: 44,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    balanceInfo: { flex: 1 },
    balanceLabel: { fontSize: 12, fontWeight: '500', marginBottom: 2 },
    balanceValue: { fontSize: 18, fontWeight: '700' },

    // Section
    sectionTitle: { fontSize: 17, fontWeight: '700', marginBottom: 14 },

    // Quick Access Grid
    quickGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
        marginBottom: 24,
    },
    quickItem: {
        width: (width - 44) / 2,
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderRadius: 16,
        elevation: 1,
    },
    quickIcon: {
        width: 44,
        height: 44,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    quickLabel: { fontSize: 14, fontWeight: '600' },

    // FAB
    fab: { position: 'absolute', right: 20, bottom: 24, borderRadius: 16 },
});
