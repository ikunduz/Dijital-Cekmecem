import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useCarContext } from '../context/CarContext';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const COLORS = {
    primary: "#1d72d3",
    background: "#E5E7EB",
    textDark: "#111417",
    textGray: "#647487",
    white: "#FFFFFF",
    border: "#e5e7eb",
};

export default function SelectCar() {
    const router = useRouter();
    const { cars, switchCar, currentCarId } = useCarContext();

    const handleSelectCar = async (carId) => {
        await switchCar(carId);
        router.replace('/');
    };

    const handleAddCar = () => {
        router.push('/add-car');
    };

    return (
        <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>

            {/* HEADER */}
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Araç Seçin</Text>
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent}>

                <Text style={styles.introText}>
                    Hangi aracınızla işlem yapmak istiyorsunuz?
                </Text>

                {/* CAR LIST */}
                <View style={styles.carList}>
                    {cars.map((car) => {
                        const isSelected = car.id === currentCarId;
                        return (
                            <TouchableOpacity
                                key={car.id}
                                style={[styles.carCard, isSelected && styles.carCardSelected]}
                                onPress={() => handleSelectCar(car.id)}
                                activeOpacity={0.7}
                            >
                                {/* Car Image or Placeholder */}
                                <View style={styles.carImageContainer}>
                                    {car.carImage ? (
                                        <Image source={{ uri: car.carImage }} style={styles.carImage} resizeMode="cover" />
                                    ) : (
                                        <View style={styles.carImagePlaceholder}>
                                            <MaterialCommunityIcons name="car" size={40} color={COLORS.textGray} />
                                        </View>
                                    )}
                                </View>

                                {/* Car Info */}
                                <View style={styles.carInfo}>
                                    <Text style={styles.carName}>
                                        {car.make && car.model ? `${car.make} ${car.model}` : 'Araç'}
                                    </Text>
                                    <Text style={styles.carPlate}>{car.plate || 'Plaka Yok'}</Text>
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

                {/* ADD NEW CAR BUTTON */}
                <TouchableOpacity style={styles.addButton} onPress={handleAddCar}>
                    <MaterialCommunityIcons name="plus-circle-outline" size={24} color={COLORS.primary} />
                    <Text style={styles.addButtonText}>Yeni Araç Ekle</Text>
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
    carList: {
        gap: 12,
    },
    carCard: {
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
    carCardSelected: {
        borderWidth: 2,
        borderColor: COLORS.primary,
    },
    carImageContainer: {
        width: 80,
        height: 60,
        borderRadius: 8,
        overflow: 'hidden',
        backgroundColor: '#f3f4f6',
    },
    carImage: {
        width: '100%',
        height: '100%',
    },
    carImagePlaceholder: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    carInfo: {
        flex: 1,
        marginLeft: 12,
    },
    carName: {
        fontSize: 16,
        fontWeight: '600',
        color: COLORS.textDark,
    },
    carPlate: {
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
