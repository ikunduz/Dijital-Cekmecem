import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

export default function DrawerGrid({ stats, financeStats }) {
    const router = useRouter();

    const drawers = [
        {
            id: 'bills',
            title: 'Faturalar',
            icon: 'receipt',
            color: '#3b82f6', // Blue
            info: stats.billInfo || 'Güncel',
            route: '/bill-history' // Assuming this route exists or we use history filtered
        },
        {
            id: 'warranties',
            title: 'Garantiler',
            icon: 'shield-check',
            color: '#8b5cf6', // Purple
            info: stats.warrantyInfo || 'Sorun Yok',
            route: '/history?filter=warranty'
        },
        {
            id: 'maintenance',
            title: 'Bakım',
            icon: 'tools',
            color: '#f97316', // Orange
            info: stats.maintenanceInfo || 'Takipte',
            route: '/history?filter=service' // Assuming service filter
        },
        {
            id: 'docs',
            title: 'Evraklar',
            icon: 'file-document-outline',
            color: '#10b981', // Emerald
            info: stats.docInfo || 'Tamam',
            route: '/archive'
        },
        {
            id: 'budget',
            title: 'Bütçem',
            icon: 'wallet',
            color: '#f59e0b', // Amber/Orange
            info: financeStats?.balance !== undefined ? `${financeStats.balance > 0 ? '+' : ''}${financeStats.balance} ₺` : 'Hesaplanıyor',
            route: '/wallet'
        },
        {
            id: 'savings',
            title: 'Birikim',
            icon: 'piggy-bank',
            color: '#ec4899', // Pink
            info: financeStats?.savingsProgress !== undefined ? `%${financeStats.savingsProgress} Tamamlandı` : 'Hedef Yok',
            route: '/savings'
        }
    ];

    const handlePress = (route) => {
        // For now, if route has query params, we might need special handling if expo-router push doesn't support complex objects directly in all versions, 
        // but standard string path works. 
        // However, existing app might not handle 'filter' param on history page yet. 
        // We will assume standard navigation for now and maybe fix history page later if needed.
        if (route.includes('?')) {
            // Simple hack: just go to the base route for now, or let context handle it. 
            // Better: user clicks warranty -> goes to history. 
            // We will just push the path string.
            router.push(route.split('?')[0]);
        } else {
            router.push(route);
        }
    };

    return (
        <View style={styles.gridContainer}>
            {drawers.map((drawer) => (
                <TouchableOpacity
                    key={drawer.id}
                    style={styles.card}
                    activeOpacity={0.7}
                    onPress={() => handlePress(drawer.route)}
                >
                    <View style={[styles.iconContainer, { backgroundColor: drawer.color + '20' }]}>
                        <MaterialCommunityIcons name={drawer.icon} size={28} color={drawer.color} />
                    </View>
                    <View style={styles.textContainer}>
                        <Text style={styles.title}>{drawer.title}</Text>
                        <Text style={styles.info} numberOfLines={1}>{drawer.info}</Text>
                    </View>
                    <MaterialCommunityIcons name="chevron-right" size={20} color="#cbd5e1" style={styles.arrow} />
                </TouchableOpacity>
            ))}
        </View>
    );
}

const styles = StyleSheet.create({
    gridContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        rowGap: 16,
    },
    card: {
        width: '48%', // 2 columns with gap
        backgroundColor: '#ffffff',
        borderRadius: 16,
        padding: 16,
        // Modern Shadow
        shadowColor: "#64748b",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 4,
        borderWidth: 1,
        borderColor: '#f1f5f9',
        position: 'relative',
        height: 120,
        justifyContent: 'space-between'
    },
    iconContainer: {
        width: 48,
        height: 48,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 8,
    },
    textContainer: {
        flex: 1,
        justifyContent: 'flex-end',
    },
    title: {
        fontSize: 16,
        fontWeight: '700',
        color: '#0f172a',
        marginBottom: 2,
    },
    info: {
        fontSize: 13,
        color: '#647487',
        fontWeight: '500',
    },
    arrow: {
        position: 'absolute',
        top: 16,
        right: 12,
    }
});
