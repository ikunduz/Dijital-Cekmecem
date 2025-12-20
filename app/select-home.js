import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useHomeContext } from '../context/HomeContext';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { useAppColors } from '../utils/theme';

export default function SelectHome() {
    const router = useRouter();
    const COLORS = useAppColors();
    const { homes, switchHome, currentHomeId } = useHomeContext();

    const handleSelectHome = async (homeId) => {
        await switchHome(homeId);
        router.replace('/');
    };

    const handleAddHome = () => {
        router.push('/add-home');
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: COLORS.background }]} edges={['top', 'left', 'right']}>

            {/* HEADER */}
            <View style={[styles.header, { backgroundColor: COLORS.surface, borderBottomColor: COLORS.border }]}>
                <Text style={[styles.headerTitle, { color: COLORS.textDark }]}>Ev Seçin</Text>
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent}>

                <Text style={[styles.introText, { color: COLORS.textGray }]}>
                    Hangi mülkünüzle işlem yapmak istiyorsunuz?
                </Text>

                {/* HOME LIST */}
                <View style={styles.listContainer}>
                    {homes.map((home) => {
                        const isSelected = home.id === currentHomeId;
                        return (
                            <TouchableOpacity
                                key={home.id}
                                style={[
                                    styles.card,
                                    { backgroundColor: COLORS.surface },
                                    isSelected && [styles.cardSelected, { borderColor: COLORS.primary }]
                                ]}
                                onPress={() => handleSelectHome(home.id)}
                                activeOpacity={0.7}
                            >
                                {/* Home Image or Placeholder */}
                                <View style={[styles.imageContainer, { backgroundColor: COLORS.background }]}>
                                    {home.homeImage ? (
                                        <Image source={{ uri: home.homeImage }} style={styles.image} resizeMode="cover" />
                                    ) : (
                                        <View style={styles.imagePlaceholder}>
                                            <MaterialCommunityIcons name="home-outline" size={40} color={COLORS.textGray} />
                                        </View>
                                    )}
                                </View>

                                {/* Home Info */}
                                <View style={styles.info}>
                                    <Text style={[styles.title, { color: COLORS.textDark }]}>
                                        {home.title || 'Evim'}
                                    </Text>
                                    <Text style={[styles.subtitle, { color: COLORS.textGray }]}>{home.address || 'Adres Girilmemiş'}</Text>
                                </View>

                                {/* Selection Indicator */}
                                {isSelected && (
                                    <View style={styles.selectedBadge}>
                                        <MaterialCommunityIcons name="check-circle" size={24} color={COLORS.primary} />
                                    </View>
                                )}
                            </TouchableOpacity>
                        );
                    })}
                </View>

                {/* ADD NEW HOME BUTTON */}
                <TouchableOpacity
                    style={[styles.addButton, { backgroundColor: COLORS.surface, borderColor: COLORS.primary }]}
                    onPress={handleAddHome}
                >
                    <MaterialCommunityIcons name="plus-circle-outline" size={24} color={COLORS.primary} />
                    <Text style={[styles.addButtonText, { color: COLORS.primary }]}>Yeni Ev Ekle</Text>
                </TouchableOpacity>

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
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 16,
        borderBottomWidth: 1,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: '700',
    },
    scrollContent: {
        padding: 16,
    },
    introText: {
        fontSize: 16,
        textAlign: 'center',
        marginBottom: 24,
    },
    listContainer: {
        gap: 12,
    },
    card: {
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: 12,
        padding: 12,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 2,
    },
    cardSelected: {
        borderWidth: 2,
    },
    imageContainer: {
        width: 80,
        height: 60,
        borderRadius: 8,
        overflow: 'hidden',
    },
    image: {
        width: '100%',
        height: '100%',
    },
    imagePlaceholder: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    info: {
        flex: 1,
        marginLeft: 12,
    },
    title: {
        fontSize: 16,
        fontWeight: '600',
    },
    subtitle: {
        fontSize: 14,
        marginTop: 2,
    },
    selectedBadge: {
        marginLeft: 8,
    },
    addButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        borderRadius: 12,
        paddingVertical: 16,
        marginTop: 24,
        borderWidth: 2,
        borderStyle: 'dashed',
    },
    addButtonText: {
        fontSize: 16,
        fontWeight: '600',
    },
});
