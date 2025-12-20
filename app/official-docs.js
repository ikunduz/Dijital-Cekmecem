import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Surface } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { useAppColors } from '../utils/theme';

export default function OfficialDocs() {
    const router = useRouter();
    const COLORS = useAppColors();

    const folders = [
        { key: 'deed', label: 'Tapu', icon: 'home-city', color: '#3b82f6' },
        { key: 'contract', label: 'Kira Kontratı', icon: 'file-sign', color: '#8b5cf6' },
        { key: 'dask', label: 'DASK', icon: 'shield-home', color: '#22c55e' },
        { key: 'insurance', label: 'Konut Sigortası', icon: 'shield-check', color: '#f97316' },
        { key: 'id', label: 'Kimlik / Pasaport', icon: 'card-account-details', color: '#ef4444' },
        { key: 'other', label: 'Diğer Belgeler', icon: 'folder-file', color: '#6b7280' },
    ];

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: COLORS.background }]} edges={['top', 'left', 'right']}>

            {/* HEADER */}
            <View style={[styles.header, { backgroundColor: COLORS.surface, borderBottomColor: COLORS.border }]}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <MaterialCommunityIcons name="arrow-left" size={24} color={COLORS.textDark} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: COLORS.textDark }]}>Resmi Evraklar</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent}>
                <Text style={[styles.introText, { color: COLORS.textGray }]}>
                    Belge türünü seçerek kayıtlarını görüntüle
                </Text>

                <View style={styles.gridContainer}>
                    {folders.map((folder) => (
                        <TouchableOpacity
                            key={folder.key}
                            style={styles.cardWrapper}
                            onPress={() => router.push({
                                pathname: '/folder-detail',
                                params: { category: 'Resmi Evraklar', subType: folder.key }
                            })}
                            activeOpacity={0.7}
                        >
                            <Surface style={[styles.card, { backgroundColor: COLORS.surface }]} elevation={2}>
                                <View style={[styles.iconCircle, { backgroundColor: `${folder.color}15` }]}>
                                    <MaterialCommunityIcons
                                        name={folder.icon}
                                        size={28}
                                        color={folder.color}
                                    />
                                </View>
                                <Text style={[styles.cardTitle, { color: COLORS.textDark }]}>{folder.label}</Text>
                            </Surface>
                        </TouchableOpacity>
                    ))}
                </View>

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
    headerTitle: {
        fontSize: 18,
        fontWeight: '700',
    },
    backButton: {
        padding: 8,
        marginLeft: -8,
    },
    scrollContent: {
        padding: 16,
    },
    introText: {
        fontSize: 15,
        marginBottom: 20,
        textAlign: 'center',
    },
    gridContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        gap: 12,
    },
    cardWrapper: {
        width: '48%',
    },
    card: {
        borderRadius: 12,
        padding: 16,
        alignItems: 'center',
        minHeight: 100,
        justifyContent: 'center',
        marginBottom: 12
    },
    iconCircle: {
        width: 48,
        height: 48,
        borderRadius: 24,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 8,
    },
    cardTitle: {
        fontSize: 13,
        fontWeight: '600',
        textAlign: 'center',
    },
});
