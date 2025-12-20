import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Icon, IconButton, Divider } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useHomeContext } from '../context/HomeContext';
import { useFinanceContext } from '../context/FinanceContext';
import { useAppColors } from '../utils/theme';

// Helper to parse Turkish date (DD.MM.YYYY)
const parseDate = (dateStr) => {
    if (!dateStr) return new Date(0);
    const parts = dateStr.split('.');
    if (parts.length === 3) {
        return new Date(parts[2], parts[1] - 1, parts[0]);
    }
    return new Date(0);
};

const SUBTYPE_LABELS = {
    electricity: 'Elektrik',
    water: 'Su',
    gas: 'Doğalgaz',
    internet: 'İnternet',
    dues: 'Aidat',
    phone: 'Telefon',
    other: 'Diğer'
};

export default function BillHistory() {
    const router = useRouter();
    const COLORS = useAppColors();
    const { history } = useHomeContext();
    const { transactions } = useFinanceContext();

    // Filter and sort bill records
    const billRecords = useMemo(() => {
        // 1. Get legacy bills from HomeContext history (type: 'bill')
        const legacyBills = history.filter(r => r.type === 'bill');

        // 2. Get new bills from FinanceContext transactions (category: 'bill')
        const financeBills = (transactions || [])
            .filter(t => t.category === 'bill')
            .map(t => ({
                id: t.id,
                type: 'bill',
                subType: 'other', // Default or map if we add bill categories later
                date: t.date,
                cost: t.amount,
                description: t.description,
                image: t.attachment,
                isFinance: true // Flag to distinguish
            }));

        const combined = [...legacyBills, ...financeBills];

        return combined.sort((a, b) => parseDate(b.date) - parseDate(a.date)); // Newest first
    }, [history, transactions]);

    // Calculate totals
    const totals = useMemo(() => {
        if (billRecords.length === 0) return null;

        const totalCost = billRecords.reduce((sum, r) => sum + (parseFloat(r.cost) || 0), 0);

        // Get oldest record date
        const oldestRecord = billRecords[billRecords.length - 1];
        const sinceDate = oldestRecord?.date || '';

        return {
            totalCost: totalCost.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' }),
            sinceDate,
            recordCount: billRecords.length
        };
    }, [billRecords]);

    const getIcon = (subType) => {
        switch (subType) {
            case 'electricity': return 'flash';
            case 'water': return 'water';
            case 'gas': return 'fire';
            case 'internet': return 'wifi';
            case 'phone': return 'phone';
            default: return 'receipt';
        }
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: COLORS.background }]} edges={['top', 'left', 'right']}>

            {/* HEADER */}
            <View style={[styles.header, { backgroundColor: COLORS.surface, borderBottomColor: COLORS.border }]}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Icon source="arrow-left" size={24} color={COLORS.textDark} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: COLORS.textDark }]}>Fatura Geçmişi</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

                {/* BILL LIST */}
                {billRecords.length === 0 ? (
                    <View style={styles.emptyState}>
                        <Icon source="receipt" size={64} color={COLORS.textGray} />
                        <Text style={[styles.emptyText, { color: COLORS.textDark }]}>Henüz fatura kaydı yok</Text>
                        <Text style={[styles.emptySubtext, { color: COLORS.textGray }]}>FAB (+) ile fatura ekleyin</Text>
                    </View>
                ) : (
                    <View style={[styles.listContainer, { backgroundColor: COLORS.surface }]}>
                        {billRecords.map((record, index) => (
                            <React.Fragment key={record.id}>
                                <TouchableOpacity
                                    style={styles.listItem}
                                    onPress={() => {
                                        if (record.isFinance) {
                                            router.push('/wallet'); // Go to wallet for finance bills for now
                                        } else {
                                            router.push({ pathname: '/add-record', params: { recordId: record.id } });
                                        }
                                    }}
                                >
                                    <View style={styles.iconColumn}>
                                        <Icon source={getIcon(record.subType)} size={24} color={COLORS.primary} />
                                    </View>
                                    <View style={styles.infoColumn}>
                                        <Text style={[styles.subTypeText, { color: COLORS.textDark }]}>{SUBTYPE_LABELS[record.subType] || 'Fatura'}</Text>
                                        <Text style={[styles.dateText, { color: COLORS.textGray }]}>{record.date}</Text>
                                    </View>
                                    <View style={styles.costColumn}>
                                        <Text style={[styles.costText, { color: COLORS.textDark }]}>{parseFloat(record.cost || 0).toLocaleString('tr-TR')} ₺</Text>
                                        {record.dueDate && <Text style={[styles.dueText, { color: COLORS.danger }]}>SON: {record.dueDate}</Text>}
                                    </View>
                                </TouchableOpacity>
                                {index < billRecords.length - 1 && <Divider style={[styles.divider, { backgroundColor: COLORS.border }]} />}
                            </React.Fragment>
                        ))}
                    </View>
                )}

                {/* TOTALS FOOTER */}
                {totals && (
                    <View style={[styles.totalsContainer, { backgroundColor: COLORS.surface }]}>
                        <View style={styles.totalsRow}>
                            <Text style={[styles.totalsLabel, { color: COLORS.textGray }]}>Toplam Harcama</Text>
                            <Text style={[styles.totalsValue, { color: COLORS.danger, fontWeight: '700' }]}>{totals.totalCost}</Text>
                        </View>
                        <Text style={[styles.sinceText, { color: COLORS.textGray, borderTopColor: COLORS.border }]}>
                            {totals.sinceDate} tarihinden beri • {totals.recordCount} kayıt
                        </Text>
                    </View>
                )}

                <View style={{ height: 40 }} />
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
    backButton: {
        padding: 8,
        marginLeft: -8,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '700',
    },
    scrollContent: {
        padding: 16,
    },
    emptyState: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 60,
    },
    emptyText: {
        fontSize: 16,
        fontWeight: '600',
        marginTop: 16,
    },
    emptySubtext: {
        fontSize: 14,
        marginTop: 4,
    },
    listContainer: {
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 8,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 2,
    },
    listItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 14,
    },
    iconColumn: {
        width: 40,
        alignItems: 'center',
    },
    infoColumn: {
        flex: 1,
        marginLeft: 8,
    },
    subTypeText: {
        fontSize: 15,
        fontWeight: '600',
    },
    dateText: {
        fontSize: 13,
    },
    costColumn: {
        width: 100,
        alignItems: 'flex-end',
    },
    costText: {
        fontSize: 15,
        fontWeight: '600',
    },
    dueText: {
        fontSize: 11,
        marginTop: 2,
    },
    divider: {
    },
    totalsContainer: {
        borderRadius: 12,
        padding: 16,
        marginTop: 16,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 2,
    },
    totalsRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    totalsLabel: {
        fontSize: 15,
    },
    totalsValue: {
        fontSize: 16,
        fontWeight: '600',
    },
    sinceText: {
        fontSize: 13,
        textAlign: 'center',
        marginTop: 8,
        paddingTop: 8,
        borderTopWidth: 1,
    },
});
