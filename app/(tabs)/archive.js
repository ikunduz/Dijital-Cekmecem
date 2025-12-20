import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput } from 'react-native';
import { Surface, IconButton, Icon } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useHomeContext } from '../../context/HomeContext';
import { useFinanceContext } from '../../context/FinanceContext';
import { BannerAdComponent } from '../../components/Ads';
import { useAppColors } from '../../utils/theme';

export default function ArchiveScreen() {
    const router = useRouter();
    const COLORS = useAppColors();
    const { history, currentHomeId } = useHomeContext();
    const { transactions } = useFinanceContext();
    const [searchQuery, setSearchQuery] = useState('');

    const categories = [
        { title: "Faturalar", subtitle: "Elektrik, Su, Doğalgaz...", icon: "receipt", color: COLORS.bill, route: '/bill-history', type: 'bill' },
        { title: "Garantiler", subtitle: "Eşya ve ürün garantileri", icon: "shield-check", color: COLORS.warranty, route: '/folder-detail?category=Garantiler', type: 'warranty' },
        { title: "Resmi Evraklar", subtitle: "Tapu, Kira, DASK...", icon: "file-document", color: COLORS.documents, route: '/folder-detail?category=Resmi Evraklar', type: 'doc' },
    ];

    // --- SEARCH LOGIC ---
    const searchResults = useMemo(() => {
        if (!searchQuery.trim()) return [];

        const query = searchQuery.toLowerCase();

        // Search in history (Legacy records)
        const historyResults = history.filter(item =>
            (item.description?.toLowerCase().includes(query)) ||
            (item.productName?.toLowerCase().includes(query)) ||
            (item.brand?.toLowerCase().includes(query)) ||
            (item.subType?.toLowerCase().includes(query))
        );

        // Search in transactions (Finance records) - Only bills or docs
        const transactionResults = (transactions || [])
            .filter(t => t.category === 'bill' || t.category === 'other_expense')
            .filter(t =>
                (t.description?.toLowerCase().includes(query)) ||
                (t.category?.toLowerCase().includes(query))
            )
            .map(t => ({
                id: t.id,
                title: t.description || 'İşlem',
                date: t.date,
                image: t.attachment,
                type: 'finance_bill',
                cost: t.amount
            }));

        return [
            ...historyResults.map(h => ({
                id: h.id,
                title: h.productName || h.description || h.subType || 'Kayıt',
                date: h.date,
                image: h.image,
                type: h.type,
                cost: h.cost
            })),
            ...transactionResults
        ];
    }, [searchQuery, history, transactions]);

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: COLORS.background }]} edges={['top', 'left', 'right']}>
            <View style={[styles.header, { backgroundColor: COLORS.surface }]}>
                <Text style={styles.headerTitle}>Çekmece</Text>
            </View>

            {/* SEARCH BAR */}
            <View style={styles.searchContainer}>
                <Surface style={styles.searchBar} elevation={2}>
                    <MaterialCommunityIcons name="magnify" size={24} color={COLORS.textGray} />
                    <TextInput
                        placeholder="Belge veya eşya ara... (örn: Buzdolabı)"
                        style={styles.searchInput}
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                        placeholderTextColor={COLORS.textGray}
                    />
                    {searchQuery !== '' && (
                        <TouchableOpacity onPress={() => setSearchQuery('')}>
                            <MaterialCommunityIcons name="close-circle" size={20} color={COLORS.textGray} />
                        </TouchableOpacity>
                    )}
                </Surface>
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                {searchQuery.trim() !== '' ? (
                    <View style={styles.resultsContainer}>
                        <Text style={styles.sectionTitle}>Arama Sonuçları ({searchResults.length})</Text>
                        {searchResults.length === 0 ? (
                            <View style={styles.emptyResults}>
                                <MaterialCommunityIcons name="file-search-outline" size={48} color={COLORS.textGray} />
                                <Text style={styles.emptyResultsText}>Sonuç bulunamadı</Text>
                            </View>
                        ) : (
                            searchResults.map((item) => (
                                <TouchableOpacity
                                    key={item.id}
                                    style={styles.resultItem}
                                    onPress={() => {
                                        // Find which category this belongs to or go to detail
                                        // For now, let's use folder-detail or similar
                                        const cat = item.type === 'bill' || item.type === 'finance_bill' ? 'Faturalar' :
                                            item.type === 'warranty' ? 'Garantiler' : 'Resmi Evraklar';
                                        router.push({ pathname: '/folder-detail', params: { category: cat, searchId: item.id } });
                                    }}
                                >
                                    <View style={styles.resultIcon}>
                                        <MaterialCommunityIcons
                                            name={item.type === 'bill' || item.type === 'finance_bill' ? "receipt" :
                                                item.type === 'warranty' ? "shield-check" : "file-document"}
                                            size={24} color={COLORS.primary}
                                        />
                                    </View>
                                    <View style={styles.resultInfo}>
                                        <Text style={styles.resultTitle} numberOfLines={1}>{item.title}</Text>
                                        <Text style={styles.resultSubtitle}>{item.date}</Text>
                                    </View>
                                    <MaterialCommunityIcons name="chevron-right" size={20} color={COLORS.textGray} />
                                </TouchableOpacity>
                            ))
                        )}
                    </View>
                ) : (
                    <View style={styles.cardsContainer}>
                        <Text style={styles.sectionTitle}>Kategoriler</Text>
                        {categories.map((category, index) => (
                            <TouchableOpacity
                                key={index}
                                style={styles.cardWrapper}
                                onPress={() => {
                                    const [pathname, query] = category.route.split('?');
                                    const params = query ? Object.fromEntries(new URLSearchParams(query)) : {};
                                    router.push({ pathname, params });
                                }}
                                activeOpacity={0.7}
                            >
                                <Surface style={[styles.card, { backgroundColor: COLORS.surface }]} elevation={1}>
                                    <View style={[styles.iconCircle, { backgroundColor: `${category.color}15` }]}>
                                        <MaterialCommunityIcons name={category.icon} size={28} color={category.color} />
                                    </View>
                                    <View style={styles.cardTextContent}>
                                        <Text style={[styles.cardTitle, { color: COLORS.textDark }]}>{category.title}</Text>
                                        <Text style={[styles.cardSubtitle, { color: COLORS.textGray }]}>{category.subtitle}</Text>
                                    </View>
                                    <MaterialCommunityIcons name="chevron-right" size={24} color={COLORS.textGray} />
                                </Surface>
                            </TouchableOpacity>
                        ))}
                    </View>
                )}
                <BannerAdComponent />
                <View style={{ height: 100 }} />
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: { paddingHorizontal: 20, paddingVertical: 20 },
    headerTitle: { fontSize: 28, fontWeight: '800' },

    searchContainer: { paddingHorizontal: 16, paddingBottom: 20 },
    searchBar: { flexDirection: 'row', alignItems: 'center', borderRadius: 16, paddingHorizontal: 16, height: 52, borderWidth: 1 },
    searchInput: { flex: 1, marginLeft: 12, fontSize: 15, height: '100%' },

    scrollContent: { paddingHorizontal: 16, paddingTop: 8 },
    sectionTitle: { fontSize: 18, fontWeight: '700', marginBottom: 20, paddingLeft: 4 },

    cardsContainer: { gap: 16 },
    cardWrapper: { width: '100%' },
    card: { flexDirection: 'row', alignItems: 'center', borderRadius: 20, padding: 18 },
    iconCircle: { width: 52, height: 52, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginRight: 16 },
    cardTextContent: { flex: 1 },
    cardTitle: { fontSize: 17, fontWeight: '700', marginBottom: 4 },
    cardSubtitle: { fontSize: 14 },

    resultsContainer: { gap: 12 },
    resultItem: { flexDirection: 'row', alignItems: 'center', borderRadius: 16, padding: 12, elevation: 1 },
    resultIcon: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
    resultInfo: { flex: 1 },
    resultTitle: { fontSize: 15, fontWeight: '600', marginBottom: 2 },
    resultSubtitle: { fontSize: 12 },

    emptyResults: { alignItems: 'center', paddingVertical: 60 },
    emptyResultsText: { fontSize: 16, marginTop: 12, fontWeight: '500' },
});
