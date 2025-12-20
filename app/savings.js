import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    TextInput,
    Alert,
    Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { IconButton, FAB } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { useFinanceContext } from '../context/FinanceContext';

const COLORS = {
    primary: '#F57C00',
    background: '#FFFFFF',
    surface: '#FFFFFF',
    border: '#e2e8f0',
    textDark: '#0f172a',
    textGray: '#647487',
    success: '#22c55e',
    warning: '#f59e0b',
    inputBg: '#f8fafc',
};

const GOAL_ICONS = [
    { id: 'airplane', icon: 'airplane', label: 'Tatil' },
    { id: 'car', icon: 'car', label: 'Araba' },
    { id: 'home', icon: 'home', label: 'Ev' },
    { id: 'laptop', icon: 'laptop', label: 'Teknoloji' },
    { id: 'gift', icon: 'gift', label: 'Hediye' },
    { id: 'heart', icon: 'heart', label: 'Sağlık' },
    { id: 'book', icon: 'book-open', label: 'Eğitim' },
    { id: 'shield', icon: 'shield', label: 'Acil Durum' },
];

export default function SavingsScreen() {
    const router = useRouter();
    const { savingsGoals, addSavingsGoal, updateSavingsGoal, deleteSavingsGoal } = useFinanceContext();

    const [showModal, setShowModal] = useState(false);
    const [newGoalName, setNewGoalName] = useState('');
    const [newGoalTarget, setNewGoalTarget] = useState('');
    const [newGoalIcon, setNewGoalIcon] = useState('airplane');
    const [addAmountModal, setAddAmountModal] = useState(null);
    const [addAmount, setAddAmount] = useState('');

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('tr-TR', {
            style: 'decimal',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(amount) + ' ₺';
    };

    const handleCreateGoal = async () => {
        if (!newGoalName.trim()) {
            Alert.alert('Hata', 'Hedef adı girin');
            return;
        }
        if (!newGoalTarget || isNaN(parseFloat(newGoalTarget)) || parseFloat(newGoalTarget) <= 0) {
            Alert.alert('Hata', 'Geçerli bir hedef tutar girin');
            return;
        }

        await addSavingsGoal({
            name: newGoalName.trim(),
            targetAmount: parseFloat(newGoalTarget),
            icon: newGoalIcon,
        });

        setNewGoalName('');
        setNewGoalTarget('');
        setNewGoalIcon('airplane');
        setShowModal(false);
    };

    const handleAddAmount = async () => {
        if (!addAmount || isNaN(parseFloat(addAmount)) || parseFloat(addAmount) <= 0) {
            Alert.alert('Hata', 'Geçerli bir tutar girin');
            return;
        }

        const goal = savingsGoals.find(g => g.id === addAmountModal);
        if (goal) {
            await updateSavingsGoal(goal.id, {
                currentAmount: (goal.currentAmount || 0) + parseFloat(addAmount),
            });
        }

        setAddAmount('');
        setAddAmountModal(null);
    };

    const handleDeleteGoal = (goalId) => {
        Alert.alert(
            'Hedefi Sil',
            'Bu birikim hedefini silmek istediğinize emin misiniz?',
            [
                { text: 'İptal', style: 'cancel' },
                { text: 'Sil', style: 'destructive', onPress: () => deleteSavingsGoal(goalId) },
            ]
        );
    };

    const getIconComponent = (iconId) => {
        const iconData = GOAL_ICONS.find(i => i.id === iconId) || GOAL_ICONS[0];
        return <MaterialCommunityIcons name={iconData.icon} size={24} color={COLORS.primary} />;
    };

    return (
        <View style={styles.container}>
            {/* HEADER */}
            <LinearGradient
                colors={['#FF9800', '#F57C00']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.header}
            >
                <SafeAreaView edges={['top']}>
                    <View style={styles.headerRow}>
                        <TouchableOpacity onPress={() => router.back()}>
                            <IconButton icon="arrow-left" size={24} iconColor="white" />
                        </TouchableOpacity>
                        <Text style={styles.headerTitle}>Birikim Hedeflerim</Text>
                        <View style={{ width: 48 }} />
                    </View>
                </SafeAreaView>
            </LinearGradient>

            <ScrollView style={styles.content} contentContainerStyle={{ paddingBottom: 100 }}>
                {savingsGoals.length === 0 ? (
                    <View style={styles.emptyState}>
                        <MaterialCommunityIcons name="piggy-bank-outline" size={80} color="#cbd5e1" />
                        <Text style={styles.emptyTitle}>Henüz birikim hedefi yok</Text>
                        <Text style={styles.emptySubtext}>
                            + butonuna basarak ilk hedefinizi oluşturun
                        </Text>
                    </View>
                ) : (
                    savingsGoals.map((goal) => {
                        const progress = goal.targetAmount > 0
                            ? Math.min(((goal.currentAmount || 0) / goal.targetAmount) * 100, 100)
                            : 0;
                        const isCompleted = progress >= 100;

                        return (
                            <TouchableOpacity
                                key={goal.id}
                                style={[styles.goalCard, { backgroundColor: COLORS.surface }]}
                                onLongPress={() => handleDeleteGoal(goal.id)}
                            >
                                <View style={styles.goalHeader}>
                                    <View style={[styles.goalIconContainer, { backgroundColor: COLORS.primary + '15' }]}>
                                        {getIconComponent(goal.icon)}
                                    </View>
                                    <View style={styles.goalInfo}>
                                        <Text style={[styles.goalName, { color: COLORS.textDark }]}>{goal.name}</Text>
                                        <Text style={[styles.goalTarget, { color: COLORS.textGray }]}>
                                            Hedef: {formatCurrency(goal.targetAmount)}
                                        </Text>
                                    </View>
                                    {isCompleted ? (
                                        <View style={[styles.completedBadge, { backgroundColor: COLORS.success }]}>
                                            <MaterialCommunityIcons name="check" size={16} color="white" />
                                        </View>
                                    ) : (
                                        <TouchableOpacity
                                            style={[styles.addButton, { backgroundColor: COLORS.primary + '15' }]}
                                            onPress={() => setAddAmountModal(goal.id)}
                                        >
                                            <MaterialCommunityIcons name="plus" size={20} color={COLORS.primary} />
                                        </TouchableOpacity>
                                    )}
                                </View>

                                <View style={styles.progressSection}>
                                    <View style={[styles.progressBarBg, { backgroundColor: COLORS.border }]}>
                                        <View
                                            style={[
                                                styles.progressBarFill,
                                                {
                                                    width: `${progress}%`,
                                                    backgroundColor: isCompleted ? COLORS.success : COLORS.primary,
                                                }
                                            ]}
                                        />
                                    </View>
                                    <View style={styles.progressLabels}>
                                        <Text style={[styles.currentAmount, { color: COLORS.textDark }]}>
                                            {formatCurrency(goal.currentAmount || 0)}
                                        </Text>
                                        <Text style={[
                                            styles.progressPercent,
                                            { color: COLORS.primary },
                                            isCompleted && { color: COLORS.success }
                                        ]}>
                                            %{Math.round(progress)}
                                        </Text>
                                    </View>
                                </View>
                            </TouchableOpacity>
                        );
                    })
                )}
            </ScrollView>

            {/* ADD GOAL MODAL */}
            <Modal visible={showModal} transparent animationType="slide">
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Yeni Birikim Hedefi</Text>
                            <TouchableOpacity onPress={() => setShowModal(false)}>
                                <MaterialCommunityIcons name="close" size={24} color={COLORS.textGray} />
                            </TouchableOpacity>
                        </View>

                        <Text style={styles.inputLabel}>Hedef Adı</Text>
                        <TextInput
                            style={styles.textInput}
                            value={newGoalName}
                            onChangeText={setNewGoalName}
                            placeholder="Örn: Yaz Tatili"
                            placeholderTextColor="#94a3b8"
                        />

                        <Text style={styles.inputLabel}>Hedef Tutar (₺)</Text>
                        <TextInput
                            style={styles.textInput}
                            value={newGoalTarget}
                            onChangeText={setNewGoalTarget}
                            placeholder="Örn: 20000"
                            placeholderTextColor="#94a3b8"
                            keyboardType="numeric"
                        />

                        <Text style={styles.inputLabel}>İkon Seçin</Text>
                        <View style={styles.iconGrid}>
                            {GOAL_ICONS.map((icon) => (
                                <TouchableOpacity
                                    key={icon.id}
                                    style={[
                                        styles.iconOption,
                                        newGoalIcon === icon.id && styles.iconOptionSelected,
                                    ]}
                                    onPress={() => setNewGoalIcon(icon.id)}
                                >
                                    <MaterialCommunityIcons
                                        name={icon.icon}
                                        size={22}
                                        color={newGoalIcon === icon.id ? COLORS.primary : COLORS.textGray}
                                    />
                                </TouchableOpacity>
                            ))}
                        </View>

                        <TouchableOpacity style={styles.createButton} onPress={handleCreateGoal}>
                            <Text style={styles.createButtonText}>Oluştur</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            {/* ADD AMOUNT MODAL */}
            <Modal visible={addAmountModal !== null} transparent animationType="fade">
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Birikim Ekle</Text>
                            <TouchableOpacity onPress={() => setAddAmountModal(null)}>
                                <MaterialCommunityIcons name="close" size={24} color={COLORS.textGray} />
                            </TouchableOpacity>
                        </View>

                        <Text style={styles.inputLabel}>Eklenecek Tutar (₺)</Text>
                        <TextInput
                            style={styles.textInput}
                            value={addAmount}
                            onChangeText={setAddAmount}
                            placeholder="Örn: 500"
                            placeholderTextColor="#94a3b8"
                            keyboardType="numeric"
                            autoFocus
                        />

                        <TouchableOpacity style={styles.createButton} onPress={handleAddAmount}>
                            <Text style={styles.createButtonText}>Ekle</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            {/* FAB */}
            <FAB
                icon="plus"
                color="white"
                style={styles.fab}
                onPress={() => setShowModal(true)}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFFFFF',
    },
    header: {
        paddingBottom: 16,
        borderBottomLeftRadius: 24,
        borderBottomRightRadius: 24,
    },
    headerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 8,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: 'white',
    },
    content: {
        flex: 1,
        paddingTop: 20,
        paddingHorizontal: 16,
    },
    emptyState: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingTop: 80,
    },
    emptyTitle: {
        fontSize: 18,
        fontWeight: '600',
        marginTop: 16,
    },
    emptySubtext: {
        fontSize: 14,
        marginTop: 8,
        textAlign: 'center',
    },
    goalCard: {
        borderRadius: 16,
        padding: 16,
        marginBottom: 12,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    goalHeader: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    goalIconContainer: {
        width: 48,
        height: 48,
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center',
    },
    goalInfo: {
        flex: 1,
        marginLeft: 12,
    },
    goalName: {
        fontSize: 16,
        fontWeight: '700',
    },
    goalTarget: {
        fontSize: 13,
        marginTop: 2,
    },
    addButton: {
        width: 36,
        height: 36,
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
    },
    completedBadge: {
        width: 36,
        height: 36,
        borderRadius: 18,
        alignItems: 'center',
        justifyContent: 'center',
    },
    progressSection: {
        marginTop: 16,
    },
    progressBarBg: {
        height: 8,
        borderRadius: 4,
        overflow: 'hidden',
    },
    progressBarFill: {
        height: '100%',
        borderRadius: 4,
    },
    progressLabels: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 8,
    },
    currentAmount: {
        fontSize: 14,
        fontWeight: '600',
    },
    progressPercent: {
        fontSize: 14,
        fontWeight: '600',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: '#FFFFFF',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        padding: 24,
        paddingBottom: 40,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 24,
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: '700',
    },
    inputLabel: {
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 8,
        marginTop: 16,
    },
    textInput: {
        backgroundColor: '#f8fafc',
        borderRadius: 12,
        padding: 14,
        fontSize: 16,
        color: '#0f172a',
    },
    iconGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10,
        marginTop: 8,
    },
    iconOption: {
        width: 48,
        height: 48,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#f8fafc',
        borderWidth: 2,
        borderColor: 'transparent',
    },
    iconOptionSelected: {
        borderColor: '#F57C00',
        backgroundColor: '#FFF3E0',
    },
    createButton: {
        backgroundColor: '#F57C00',
        borderRadius: 12,
        padding: 16,
        alignItems: 'center',
        marginTop: 24,
    },
    createButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '700',
    },
    fab: {
        position: 'absolute',
        right: 20,
        bottom: 24,
        borderRadius: 16,
        backgroundColor: '#F57C00',
    },
});
