import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useHomeContext } from '../context/HomeContext';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const COLORS = {
    primary: "#F57C00",
    background: "#E5E7EB",
    textDark: "#111417",
    textGray: "#647487",
    white: "#FFFFFF",
    border: "#e5e7eb",
};

export default function SelectHome() {
    const router = useRouter();
    const { homes, switchHome, currentHomeId } = useHomeContext();

    const handleSelectHome = async (homeId) => {
        await switchHome(homeId);
        router.replace('/');
    };

    const handleAddHome = () => {
        router.push('/add-home');
    };

    return (
        <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>

            {/* HEADER */}
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Ev Seçin</Text>
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent}>

                <Text style={styles.introText}>
                    Hangi mülkünüzle işlem yapmak istiyorsunuz?
                </Text>

                {/* HOME LIST */}
                <View style={styles.listContainer}>
                    {homes.map((home) => {
                        const isSelected = home.id === currentHomeId;
                        return (
                            <TouchableOpacity
                                key={home.id}
                                style={[styles.card, isSelected && styles.cardSelected]}
                                onPress={() => handleSelectHome(home.id)}
                                activeOpacity={0.7}
                            >
                                {/* Home Image or Placeholder */}
                                <View style={styles.imageContainer}>
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
                                    <Text style={styles.title}>
                                        {home.title || 'Evim'}
                                    </Text>
                                    <Text style={styles.subtitle}>{home.address || 'Adres Girilmemiş'}</Text>
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
                <TouchableOpacity style={styles.addButton} onPress={handleAddHome}>
                    <MaterialCommunityIcons name="plus-circle-outline" size={24} color={COLORS.primary} />
                    <Text style={styles.addButtonText}>Yeni Ev Ekle</Text>
                </TouchableOpacity>

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
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 16,
        backgroundColor: COLORS.white,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: COLORS.textDark,
    },
    scrollContent: {
        padding: 16,
    },
    introText: {
        fontSize: 16,
        color: COLORS.textGray,
        textAlign: 'center',
        marginBottom: 24,
    },
    listContainer: {
        gap: 12,
    },
    card: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.white,
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
        borderColor: COLORS.primary,
    },
    imageContainer: {
        width: 80,
        height: 60,
        borderRadius: 8,
        overflow: 'hidden',
        backgroundColor: '#f3f4f6',
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
        color: COLORS.textDark,
    },
    subtitle: {
        fontSize: 14,
        color: COLORS.textGray,
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
        backgroundColor: COLORS.white,
        borderRadius: 12,
        paddingVertical: 16,
        marginTop: 24,
        borderWidth: 2,
        borderStyle: 'dashed',
        borderColor: COLORS.primary,
    },
    addButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: COLORS.primary,
    },
});
