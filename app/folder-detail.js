import React, { useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, Image, Modal, ScrollView, Alert } from 'react-native';
import { Icon } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useCarContext } from '../context/CarContext';
import * as Sharing from 'expo-sharing';

const COLORS = {
    primary: "#1d72d3",
    background: "#E5E7EB",
    textDark: "#111417",
    textGray: "#647487",
    white: "#FFFFFF",
    border: "#e5e7eb",
    danger: "#ef4444",
};

export default function FolderDetail() {
    const router = useRouter();
    const { category, subType } = useLocalSearchParams();
    const { history, deleteRecord } = useCarContext();
    const [previewItem, setPreviewItem] = React.useState(null);

    const filteredDocs = useMemo(() => {
        if (!category && !subType) return [];

        return history.filter(item => {
            // If subType is provided (from official-docs screen), filter by it
            if (subType) {
                return item.type === 'doc' && item.subType === subType;
            }

            // Fallback: Filter based on selected folder category
            if (category === 'Resmi Evraklar') {
                return item.type === 'doc';
            }
            if (category === 'Servis Fişleri') {
                return item.type === 'service';
            }
            if (category === 'Yakıt Fişleri') {
                return item.type === 'fuel';
            }

            return false;
        });
    }, [history, category, subType]);

    // Helper to check if file is PDF
    const isPdfFile = (uri) => {
        if (!uri) return false;
        return uri.toLowerCase().includes('.pdf') || uri.includes('pdf');
    };

    // Get display info based on record type
    const getRecordInfo = (item) => {
        // Ruhsat - show Motor No and Şase No
        if (item.subType === 'license') {
            return {
                title: 'Ruhsat Bilgileri',
                lines: [
                    item.motorNo ? { label: 'Motor No', value: item.motorNo } : null,
                    item.chasisNo ? { label: 'Şase No', value: item.chasisNo } : null,
                    { label: 'Tescil Tarihi', value: item.date },
                ].filter(Boolean)
            };
        }

        // Kasko / Sigorta - show insurance company
        if (item.subType === 'kasko' || item.subType === 'insurance') {
            return {
                title: item.subType === 'kasko' ? 'Kasko Bilgileri' : 'Sigorta Bilgileri',
                lines: [
                    item.insuranceCompany ? { label: 'Şirket', value: item.insuranceCompany } : null,
                    { label: 'Tarih', value: item.date },
                    item.cost ? { label: 'Tutar', value: `${parseFloat(item.cost).toLocaleString('tr-TR')} ₺` } : null,
                ].filter(Boolean)
            };
        }

        // MTV
        if (item.subType === 'mtv') {
            return {
                title: 'MTV Ödeme Bilgileri',
                lines: [
                    item.mtvYear ? { label: 'Yıl', value: item.mtvYear } : null,
                    item.mtvPeriods?.includes('jan') ? { label: 'Dönem', value: 'Ocak (Ödendi)' } : null,
                    item.mtvPeriods?.includes('jul') ? { label: 'Dönem', value: 'Temmuz (Ödendi)' } : null,
                    item.cost ? { label: 'Tutar', value: `${parseFloat(item.cost).toLocaleString('tr-TR')} ₺` } : null,
                ].filter(Boolean)
            };
        }

        // Muayene
        if (item.subType === 'inspection') {
            return {
                title: 'Muayene Bilgileri',
                lines: [
                    { label: 'Son Muayene', value: item.date },
                ].filter(Boolean)
            };
        }

        // Kaza/Hasar
        if (item.subType === 'accident') {
            return {
                title: 'Kaza/Hasar Kaydı',
                lines: [
                    { label: 'Tarih', value: item.date },
                    item.description ? { label: 'Açıklama', value: item.description } : null,
                ].filter(Boolean)
            };
        }

        // Eksper
        if (item.subType === 'eksper') {
            return {
                title: 'Eksper Raporu',
                lines: [
                    { label: 'Rapor Tarihi', value: item.date },
                    item.description ? { label: 'Not', value: item.description } : null,
                ].filter(Boolean)
            };
        }

        // Service
        if (item.type === 'service') {
            return {
                title: 'Bakım Kaydı',
                lines: [
                    { label: 'Tarih', value: item.date },
                    item.km ? { label: 'KM', value: parseInt(item.km).toLocaleString('tr-TR') } : null,
                    item.cost ? { label: 'Tutar', value: `${parseFloat(item.cost).toLocaleString('tr-TR')} ₺` } : null,
                    item.description ? { label: 'Not', value: item.description } : null,
                ].filter(Boolean)
            };
        }

        // Fuel
        if (item.type === 'fuel') {
            return {
                title: 'Yakıt Kaydı',
                lines: [
                    { label: 'Tarih', value: item.date },
                    item.liters ? { label: 'Litre', value: `${item.liters} Lt` } : null,
                    item.km ? { label: 'KM', value: parseInt(item.km).toLocaleString('tr-TR') } : null,
                    item.cost ? { label: 'Tutar', value: `${parseFloat(item.cost).toLocaleString('tr-TR')} ₺` } : null,
                ].filter(Boolean)
            };
        }

        // Default
        return {
            title: 'Belge Detayı',
            lines: [
                { label: 'Tarih', value: item.date },
                item.description ? { label: 'Açıklama', value: item.description } : null,
            ].filter(Boolean)
        };
    };

    const handleDelete = (item) => {
        Alert.alert(
            "Kaydı Sil",
            "Bu kaydı silmek istediğinize emin misiniz?",
            [
                { text: "İptal", style: "cancel" },
                {
                    text: "Sil",
                    style: "destructive",
                    onPress: async () => {
                        await deleteRecord(item.id);
                        setPreviewItem(null);
                    }
                }
            ]
        );
    };

    const renderItem = ({ item }) => {
        const isPdf = isPdfFile(item.image);
        const info = getRecordInfo(item);
        // Display summary for card
        const displayLines = info.lines.slice(0, 2).map(l => `${l.label}: ${l.value}`);

        return (
            <TouchableOpacity
                style={styles.card}
                onPress={() => setPreviewItem(item)}
            >
                {/* Preview Area */}
                <View style={styles.cardImageContainer}>
                    {item.image ? (
                        isPdf ? (
                            // PDF icon
                            <View style={styles.pdfContainer}>
                                <Icon source="file-pdf-box" size={40} color="#ef4444" />
                                <Text style={styles.pdfLabel}>PDF</Text>
                            </View>
                        ) : (
                            // Image
                            <Image source={{ uri: item.image }} style={styles.cardImage} resizeMode="cover" />
                        )
                    ) : (
                        // No file
                        <View style={styles.noFileContainer}>
                            <Icon source="file-document-outline" size={32} color={COLORS.textGray} />
                        </View>
                    )}
                </View>

                {/* Content */}
                <View style={styles.cardContent}>
                    <Text style={styles.cardTitle}>{info.title.replace(' Bilgileri', '')}</Text>
                    {displayLines.map((line, index) => (
                        <Text key={index} style={styles.cardLine} numberOfLines={1}>
                            {line}
                        </Text>
                    ))}
                </View>
            </TouchableOpacity>
        );
    };

    // Open PDF using share dialog
    const openPdf = async (uri) => {
        try {
            const isAvailable = await Sharing.isAvailableAsync();
            if (isAvailable) {
                await Sharing.shareAsync(uri, {
                    mimeType: 'application/pdf',
                    dialogTitle: 'PDF Dosyasını Aç',
                });
            } else {
                Alert.alert('Hata', 'Bu cihazda dosya paylaşımı desteklenmiyor.');
            }
        } catch (error) {
            console.error('Error opening PDF:', error);
            Alert.alert('Hata', 'PDF açılırken bir sorun oluştu.');
        }
    };

    // Open Image
    const openImage = async (uri) => {
        try {
            const isAvailable = await Sharing.isAvailableAsync();
            if (isAvailable) {
                await Sharing.shareAsync(uri, {
                    mimeType: 'image/jpeg',
                    dialogTitle: 'Görüntüyü Aç',
                });
            }
        } catch (error) {
            console.error('Error opening Image:', error);
            Alert.alert('Hata', 'Dosya açılırken bir sorun oluştu.');
        }
    }

    return (
        <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>

            {/* HEADER */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Icon source="arrow-left" size={24} color={COLORS.textDark} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>{category || 'Belgeler'}</Text>
                <View style={{ width: 40 }} />
            </View>

            {/* CONTENT */}
            {filteredDocs.length > 0 ? (
                <FlatList
                    data={filteredDocs}
                    renderItem={renderItem}
                    keyExtractor={(item) => item.id.toString()}
                    contentContainerStyle={styles.listContent}
                    numColumns={2}
                    columnWrapperStyle={{ gap: 12 }}
                />
            ) : (
                <View style={styles.emptyContainer}>
                    <View style={styles.iconCircle}>
                        <Icon source="folder-open-outline" size={48} color={COLORS.textGray} />
                    </View>
                    <Text style={styles.emptyTitle}>Bu klasör boş</Text>
                    <Text style={styles.emptySubtitle}>
                        Ana ekrandaki (+) butonuna basarak yeni kayıt ekleyebilirsiniz.
                    </Text>
                </View>
            )}

            {/* DETAIL MODAL */}
            <Modal visible={!!previewItem} animationType="slide" onRequestClose={() => setPreviewItem(null)}>
                <SafeAreaView style={styles.modalContainer}>
                    {/* Modal Header */}
                    <View style={styles.header}>
                        <TouchableOpacity onPress={() => setPreviewItem(null)} style={styles.backButton}>
                            <Icon source="close" size={24} color={COLORS.textDark} />
                        </TouchableOpacity>
                        <Text style={styles.headerTitle}>Kayıt Detayı</Text>
                        <TouchableOpacity onPress={() => handleDelete(previewItem)} style={styles.backButton}>
                            <Icon source="trash-can-outline" size={24} color={COLORS.danger} />
                        </TouchableOpacity>
                    </View>

                    {previewItem && (
                        <ScrollView style={styles.modalContent} contentContainerStyle={styles.modalScrollContent}>

                            {/* 1. INFO SECTION (Top) */}
                            <View style={styles.detailsContainer}>
                                <Text style={styles.detailsTitle}>{getRecordInfo(previewItem).title}</Text>

                                {getRecordInfo(previewItem).lines.map((item, index) => (
                                    <View key={index} style={styles.detailRow}>
                                        <Text style={styles.detailLabel}>{item.label}</Text>
                                        <Text style={styles.detailValue}>{item.value}</Text>
                                    </View>
                                ))}
                            </View>

                            {/* 2. FILE SECTION (Bottom) */}
                            {previewItem.image ? (
                                <View style={styles.fileSection}>
                                    <Text style={styles.sectionTitle}>Dosya Eki</Text>

                                    <TouchableOpacity
                                        style={styles.fileButton}
                                        onPress={() => isPdfFile(previewItem.image) ? openPdf(previewItem.image) : openImage(previewItem.image)}
                                    >
                                        <View style={[styles.fileIconBox, { backgroundColor: isPdfFile(previewItem.image) ? '#fef2f2' : '#f0f9ff' }]}>
                                            <Icon
                                                source={isPdfFile(previewItem.image) ? "file-pdf-box" : "image"}
                                                size={32}
                                                color={isPdfFile(previewItem.image) ? COLORS.danger : COLORS.primary}
                                            />
                                        </View>
                                        <View style={{ flex: 1 }}>
                                            <Text style={styles.fileName}>
                                                {isPdfFile(previewItem.image) ? 'PDF Dosyası' : 'Resim Dosyası'}
                                            </Text>
                                            <Text style={styles.fileAction}>
                                                Görüntülemek için tıklayın
                                            </Text>
                                        </View>
                                        <Icon source="chevron-right" size={24} color={COLORS.textGray} />
                                    </TouchableOpacity>
                                </View>
                            ) : (
                                // No file attached
                                <View style={styles.fileSection}>
                                    <Text style={styles.sectionTitle}>Dosya Eki</Text>
                                    <View style={styles.noFileRow}>
                                        <Icon source="file-hidden" size={24} color={COLORS.textGray} />
                                        <Text style={styles.noFileText}>Dosya eklenmemiş</Text>
                                    </View>
                                </View>
                            )}

                        </ScrollView>
                    )}
                </SafeAreaView>
            </Modal>
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
        borderBottomColor: COLORS.border,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: COLORS.textDark,
    },
    backButton: {
        padding: 8,
        marginLeft: -8,
        marginRight: -8,
    },

    listContent: {
        padding: 12,
        paddingBottom: 100,
    },

    // CARD
    card: {
        flex: 1,
        backgroundColor: COLORS.white,
        borderRadius: 12,
        overflow: 'hidden',
        marginBottom: 12,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
    },
    cardImageContainer: {
        height: 100,
        backgroundColor: '#f3f4f6',
        justifyContent: 'center',
        alignItems: 'center',
    },
    cardImage: {
        width: '100%',
        height: '100%',
    },
    pdfContainer: {
        alignItems: 'center',
        gap: 4,
    },
    pdfLabel: {
        fontSize: 10,
        fontWeight: '600',
        color: '#ef4444',
    },
    noFileContainer: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    cardContent: {
        padding: 10,
    },
    cardTitle: {
        fontSize: 13,
        fontWeight: '700',
        color: COLORS.textDark,
        marginBottom: 4,
    },
    cardLine: {
        fontSize: 11,
        color: COLORS.textGray,
        marginBottom: 2,
    },

    // EMPTY STATE
    emptyContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        padding: 32,
    },
    iconCircle: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: '#e5e7eb',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 24,
    },
    emptyTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: COLORS.textDark,
        marginBottom: 8,
    },
    emptySubtitle: {
        fontSize: 14,
        color: COLORS.textGray,
        textAlign: 'center',
        lineHeight: 20,
    },

    // MODAL
    modalContainer: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    modalContent: {
        flex: 1,
    },
    modalScrollContent: {
        padding: 20,
        paddingBottom: 40,
    },

    // DETAIL STYLES
    detailsContainer: {
        backgroundColor: COLORS.white,
        borderRadius: 12,
        padding: 16,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    detailsTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: COLORS.textDark,
        marginBottom: 16,
        paddingBottom: 12,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
    },
    detailRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#f3f4f6',
    },
    detailLabel: {
        fontSize: 14,
        color: COLORS.textGray,
        fontWeight: '500',
    },
    detailValue: {
        fontSize: 14,
        color: COLORS.textDark,
        fontWeight: '600',
        flex: 1,
        textAlign: 'right',
        marginLeft: 16,
    },

    // FILE SECTION
    sectionTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: COLORS.textDark,
        marginBottom: 12,
        marginLeft: 4,
    },
    fileSection: {
        marginBottom: 20,
    },
    fileButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.white, // White card for file
        padding: 16,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: COLORS.border,
        gap: 16,
    },
    fileIconBox: {
        width: 50,
        height: 50,
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
    },
    fileName: {
        fontSize: 15,
        fontWeight: '600',
        color: COLORS.textDark,
        marginBottom: 2,
    },
    fileAction: {
        fontSize: 13,
        color: COLORS.primary,
        fontWeight: '500',
    },
    noFileRow: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        backgroundColor: COLORS.white,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: COLORS.border,
        gap: 12,
    },
    noFileText: {
        color: COLORS.textGray,
        fontSize: 14,
    },
});
