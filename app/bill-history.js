import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Icon, IconButton, Divider } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useHomeContext } from '../context/HomeContext';

const COLORS = {
    primary: "#F57C00",
    background: "#E5E7EB",
    textDark: "#111417",
    textGray: "#647487",
    white: "#FFFFFF",
    green: "#22c55e",
    red: "#ef4444",
};

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
    const { history } = useHomeContext();

    // Filter and sort bill records
    const billRecords = useMemo(() => {
        return history
            .filter(r => r.type === 'bill')
            .sort((a, b) => parseDate(b.date) - parseDate(a.date)); // Newest first
    }, [history]);

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
        <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>

            {/* HEADER */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Icon source="arrow-left" size={24} color={COLORS.textDark} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Fatura Geçmişi</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

                {/* BILL LIST */}
                {billRecords.length === 0 ? (
                    <View style={styles.emptyState}>
                        <Icon source="receipt" size={64} color={COLORS.textGray} />
                        <Text style={styles.emptyText}>Henüz fatura kaydı yok</Text>
                        <Text style={styles.emptySubtext}>FAB (+) ile fatura ekleyin</Text>
                    </View>
                ) : (
                    <View style={styles.listContainer}>
                        {billRecords.map((record, index) => (
                            <React.Fragment key={record.id}>
                                <TouchableOpacity
                                    style={styles.listItem}
                                    onPress={() => router.push({ pathname: '/add-record', params: { recordId: record.id } })}
                                >
                                    <View style={styles.iconColumn}>
                                        <Icon source={getIcon(record.subType)} size={24} color={COLORS.primary} />
                                    </View>
                                    <View style={styles.infoColumn}>
                                        <Text style={styles.subTypeText}>{SUBTYPE_LABELS[record.subType] || 'Fatura'}</Text>
                                        <Text style={styles.dateText}>{record.date}</Text>
                                    </View>
                                    <View style={styles.costColumn}>
                                        <Text style={styles.costText}>{parseFloat(record.cost || 0).toLocaleString('tr-TR')} ₺</Text>
                                        {record.dueDate && <Text style={styles.dueText}>SON: {record.dueDate}</Text>}
                                    </View>
                                </TouchableOpacity>
                                {index < billRecords.length - 1 && <Divider style={styles.divider} />}
                            </React.Fragment>
                        ))}
                    </View>
                )}

                {/* TOTALS FOOTER */}
                {totals && (
                    <View style={styles.totalsContainer}>
                        <View style={styles.totalsRow}>
                            <Text style={styles.totalsLabel}>Toplam Harcama</Text>
                            <Text style={[styles.totalsValue, { color: COLORS.red, fontWeight: '700' }]}>{totals.totalCost}</Text>
                        </View>
                        <Text style={styles.sinceText}>
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
        backgroundColor: COLORS.background,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: COLORS.white,
        borderBottomWidth: 1,
        borderBottomColor: '#e5e7eb',
    },
    backButton: {
        padding: 8,
        marginLeft: -8,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: COLORS.textDark,
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
        color: COLORS.textDark,
        marginTop: 16,
    },
    emptySubtext: {
        fontSize: 14,
        color: COLORS.textGray,
        marginTop: 4,
    },
    listContainer: {
        backgroundColor: COLORS.white,
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
        color: COLORS.textDark,
    },
    dateText: {
        fontSize: 13,
        color: COLORS.textGray,
    },
    costColumn: {
        width: 100,
        alignItems: 'flex-end',
    },
    costText: {
        fontSize: 15,
        fontWeight: '600',
        color: COLORS.textDark,
    },
    dueText: {
        fontSize: 11,
        color: COLORS.red,
        marginTop: 2,
    },
    divider: {
        backgroundColor: '#f3f4f6',
    },
    totalsContainer: {
        backgroundColor: COLORS.white,
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
        color: COLORS.textGray,
    },
    totalsValue: {
        fontSize: 16,
        fontWeight: '600',
        color: COLORS.textDark,
    },
    sinceText: {
        fontSize: 13,
        color: COLORS.textGray,
        textAlign: 'center',
        marginTop: 8,
        paddingTop: 8,
        borderTopWidth: 1,
        borderTopColor: '#f3f4f6',
    },
});
