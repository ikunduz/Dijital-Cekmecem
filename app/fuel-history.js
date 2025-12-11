import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Icon, IconButton, Divider } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useCarContext } from '../context/CarContext';

const COLORS = {
    primary: "#1d72d3",
    background: "#f6f7f8",
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

export default function FuelHistory() {
    const router = useRouter();
    const { history } = useCarContext();

    // Filter and sort fuel records
    const fuelRecords = useMemo(() => {
        return history
            .filter(r => r.type === 'fuel')
            .sort((a, b) => parseDate(b.date) - parseDate(a.date)); // Newest first
    }, [history]);

    // Calculate totals
    const totals = useMemo(() => {
        if (fuelRecords.length === 0) return null;

        const totalCost = fuelRecords.reduce((sum, r) => sum + (parseFloat(r.cost) || 0), 0);
        const totalLiters = fuelRecords.reduce((sum, r) => sum + (parseFloat(r.liters) || 0), 0);

        // Get oldest record date
        const oldestRecord = fuelRecords[fuelRecords.length - 1];
        const sinceDate = oldestRecord?.date || '';

        return {
            totalCost: totalCost.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' }),
            totalLiters: totalLiters.toFixed(1),
            sinceDate,
            recordCount: fuelRecords.length
        };
    }, [fuelRecords]);

    return (
        <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>

            {/* HEADER */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Icon source="arrow-left" size={24} color={COLORS.textDark} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Yakıt Geçmişi</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

                {/* FUEL LIST */}
                {fuelRecords.length === 0 ? (
                    <View style={styles.emptyState}>
                        <Icon source="gas-station" size={64} color={COLORS.textGray} />
                        <Text style={styles.emptyText}>Henüz yakıt kaydı yok</Text>
                        <Text style={styles.emptySubtext}>FAB (+) ile yakıt ekleyin</Text>
                    </View>
                ) : (
                    <View style={styles.listContainer}>
                        {fuelRecords.map((record, index) => (
                            <React.Fragment key={record.id}>
                                <View style={styles.listItem}>
                                    <View style={styles.dateColumn}>
                                        <Text style={styles.dateText}>{record.date}</Text>
                                    </View>
                                    <View style={styles.litersColumn}>
                                        <Text style={styles.litersText}>{record.liters || '-'} L</Text>
                                    </View>
                                    <View style={styles.costColumn}>
                                        <Text style={styles.costText}>{parseFloat(record.cost || 0).toLocaleString('tr-TR')} ₺</Text>
                                    </View>
                                </View>
                                {index < fuelRecords.length - 1 && <Divider style={styles.divider} />}
                            </React.Fragment>
                        ))}
                    </View>
                )}

                {/* TOTALS FOOTER */}
                {totals && (
                    <View style={styles.totalsContainer}>
                        <View style={styles.totalsRow}>
                            <Text style={styles.totalsLabel}>Toplam Yakıt</Text>
                            <Text style={styles.totalsValue}>{totals.totalLiters} Litre</Text>
                        </View>
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

    // EMPTY STATE
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

    // LIST
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
    dateColumn: {
        flex: 1,
    },
    dateText: {
        fontSize: 14,
        color: COLORS.textGray,
    },
    litersColumn: {
        width: 70,
        alignItems: 'center',
    },
    litersText: {
        fontSize: 15,
        fontWeight: '600',
        color: COLORS.primary,
    },
    costColumn: {
        width: 90,
        alignItems: 'flex-end',
    },
    costText: {
        fontSize: 15,
        fontWeight: '600',
        color: COLORS.textDark,
    },
    divider: {
        backgroundColor: '#f3f4f6',
    },

    // TOTALS
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
