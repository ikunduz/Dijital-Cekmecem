import React, { useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, Image, Modal, ScrollView, Alert } from 'react-native';
import { Icon } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useHomeContext } from '../context/HomeContext';
import * as Sharing from 'expo-sharing';

const COLORS = {
    primary: "#F57C00",
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
    const { history, deleteRecord } = useHomeContext();
    const [previewItem, setPreviewItem] = React.useState(null);

    const filteredDocs = useMemo(() => {
        if (!category && !subType) return [];

        return history.filter(item => {
            // New Categories
            if (category === 'Faturalar') {
                return item.type === 'bill';
            }
            if (category === 'Garantiler') {
                return item.type === 'warranty';
            }
            if (category === 'Resmi Evraklar') {
                return item.type === 'doc';
            }
            return false;
        });
    }, [history, category, subType]);

    const isPdfFile = (uri) => {
        if (!uri) return false;
        return uri.toLowerCase().includes('.pdf') || uri.includes('pdf');
    };

    const getRecordInfo = (item) => {
        // Bill
        if (item.type === 'bill') {
            return {
                title: 'Fatura Detayı',
                lines: [
                    { label: 'Tarih', value: item.date },
                    item.cost ? { label: 'Tutar', value: `${parseFloat(item.cost).toLocaleString('tr-TR')} ₺` } : null,
                    item.dueDate ? { label: 'Son Ödeme', value: item.dueDate } : null,
                    item.description ? { label: 'Not', value: item.description } : null,
                ].filter(Boolean)
            };
        }

        // Warranty
        if (item.type === 'warranty') {
            return {
                title: 'Garanti Detayı',
                lines: [
                    item.productName ? { label: 'Ürün', value: item.productName } : null,
                    item.brand ? { label: 'Marka', value: item.brand } : null,
                    item.date ? { label: 'Bitiş', value: item.date } : null, // Assuming date is warranty end or we use 'date' field
                ].filter(Boolean)
            };
        }

        // Doc
        if (item.type === 'doc') {
            return {
                title: 'Belge Detayı',
                lines: [
                    { label: 'Tür', value: item.subType || 'Belge' },
                    { label: 'Tarih', value: item.date },
                    item.description ? { label: 'Açıklama', value: item.description } : null,
                ].filter(Boolean)
            };
        }

        return {
            title: 'Detay',
            lines: [
                { label: 'Tarih', value: item.date }
            ]
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
        const displayLines = info.lines.slice(0, 3).map(l => `${l.label}: ${l.value}`);

        return (
            <TouchableOpacity
                style={styles.card}
                onPress={() => setPreviewItem(item)}
            >
                <View style={styles.cardImageContainer}>
                    {item.image ? (
                        isPdf ? (
                            <View style={styles.pdfContainer}>
                                <Icon source="file-pdf-box" size={40} color="#ef4444" />
                                <Text style={styles.pdfLabel}>PDF</Text>
                            </View>
                        ) : (
                            <Image source={{ uri: item.image }} style={styles.cardImage} resizeMode="cover" />
                        )
                    ) : (
                        <View style={styles.noFileContainer}>
                            <Icon source="file-document-outline" size={32} color={COLORS.textGray} />
                        </View>
                    )}
                </View>

                <View style={styles.cardContent}>
                    <Text style={styles.cardTitle}>{info.title}</Text>
                    {displayLines.map((line, index) => (
                        <Text key={index} style={styles.cardLine} numberOfLines={1}>
                            {line}
                        </Text>
                    ))}
                </View>
            </TouchableOpacity>
        );
    };

    const openPdf = async (uri) => {
        try {
            const isAvailable = await Sharing.isAvailableAsync();
            if (isAvailable) {
                await Sharing.shareAsync(uri, { mimeType: 'application/pdf', dialogTitle: 'PDF Dosyasını Aç' });
            } else {
                Alert.alert('Hata', 'Paylaşım desteklenmiyor.');
            }
        } catch (error) {
            console.error('Error opening PDF:', error);
            Alert.alert('Hata', 'PDF açılamadı.');
        }
    };

    const openImage = async (uri) => {
        try {
            const isAvailable = await Sharing.isAvailableAsync();
            if (isAvailable) {
                await Sharing.shareAsync(uri, { mimeType: 'image/jpeg', dialogTitle: 'Görüntüyü Aç' });
            }
        } catch (error) {
            Alert.alert('Hata', 'Dosya açılamadı.');
        }
    }

    return (
        <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Icon source="arrow-left" size={24} color={COLORS.textDark} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>{category || 'Belgeler'}</Text>
                <View style={{ width: 40 }} />
            </View>

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
                    <Text style={styles.emptySubtitle}>Ana ekrandaki (+) butonuna basarak yeni kayıt ekleyebilirsiniz.</Text>
                </View>
            )}

            <Modal visible={!!previewItem} animationType="slide" onRequestClose={() => setPreviewItem(null)}>
                <SafeAreaView style={styles.modalContainer}>
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
                            <View style={styles.detailsContainer}>
                                <Text style={styles.detailsTitle}>{getRecordInfo(previewItem).title}</Text>
                                {getRecordInfo(previewItem).lines.map((item, index) => (
                                    <View key={index} style={styles.detailRow}>
                                        <Text style={styles.detailLabel}>{item.label}</Text>
                                        <Text style={styles.detailValue}>{item.value}</Text>
                                    </View>
                                ))}
                            </View>

                            {previewItem.image ? (
                                <View style={styles.fileSection}>
                                    <Text style={styles.sectionTitle}>Dosya Eki</Text>
                                    <TouchableOpacity
                                        style={styles.fileButton}
                                        onPress={() => isPdfFile(previewItem.image) ? openPdf(previewItem.image) : openImage(previewItem.image)}
                                    >
                                        <View style={[styles.fileIconBox, { backgroundColor: isPdfFile(previewItem.image) ? '#fef2f2' : '#f0f9ff' }]}>
                                            <Icon source={isPdfFile(previewItem.image) ? "file-pdf-box" : "image"} size={32} color={isPdfFile(previewItem.image) ? COLORS.danger : COLORS.primary} />
                                        </View>
                                        <View style={{ flex: 1 }}>
                                            <Text style={styles.fileName}>{isPdfFile(previewItem.image) ? 'PDF Dosyası' : 'Resim Dosyası'}</Text>
                                            <Text style={styles.fileAction}>Görüntülemek için tıklayın</Text>
                                        </View>
                                        <Icon source="chevron-right" size={24} color={COLORS.textGray} />
                                    </TouchableOpacity>
                                </View>
                            ) : null}
                        </ScrollView>
                    )}
                </SafeAreaView>
            </Modal>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.background },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, backgroundColor: COLORS.white, borderBottomWidth: 1, borderBottomColor: COLORS.border },
    headerTitle: { fontSize: 18, fontWeight: '700', color: COLORS.textDark },
    backButton: { padding: 8, marginHorizontal: -8 },
    listContent: { padding: 12, paddingBottom: 100 },
    card: { flex: 1, backgroundColor: COLORS.white, borderRadius: 12, overflow: 'hidden', marginBottom: 12, elevation: 2 },
    cardImageContainer: { height: 100, backgroundColor: '#f3f4f6', justifyContent: 'center', alignItems: 'center' },
    cardImage: { width: '100%', height: '100%' },
    pdfContainer: { alignItems: 'center', gap: 4 },
    pdfLabel: { fontSize: 10, fontWeight: '600', color: '#ef4444' },
    cardContent: { padding: 10 },
    cardTitle: { fontSize: 13, fontWeight: '700', color: COLORS.textDark, marginBottom: 4 },
    cardLine: { fontSize: 11, color: COLORS.textGray, marginBottom: 2 },
    emptyContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
    iconCircle: { width: 100, height: 100, borderRadius: 50, backgroundColor: '#e5e7eb', alignItems: 'center', justifyContent: 'center', marginBottom: 24 },
    emptyTitle: { fontSize: 20, fontWeight: '700', color: COLORS.textDark, marginBottom: 8 },
    emptySubtitle: { fontSize: 14, color: COLORS.textGray, textAlign: 'center', lineHeight: 20 },
    modalContainer: { flex: 1, backgroundColor: COLORS.background },
    modalContent: { flex: 1 },
    modalScrollContent: { padding: 20, paddingBottom: 40 },
    detailsContainer: { backgroundColor: COLORS.white, borderRadius: 12, padding: 16, marginBottom: 20, borderWidth: 1, borderColor: COLORS.border },
    detailsTitle: { fontSize: 18, fontWeight: '700', color: COLORS.textDark, marginBottom: 16, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: COLORS.border },
    detailRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
    detailLabel: { fontSize: 14, color: COLORS.textGray, fontWeight: '500' },
    detailValue: { fontSize: 14, color: COLORS.textDark, fontWeight: '600', flex: 1, textAlign: 'right', marginLeft: 16 },
    sectionTitle: { fontSize: 16, fontWeight: '700', color: COLORS.textDark, marginBottom: 12, marginLeft: 4 },
    fileSection: { marginBottom: 20 },
    fileButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.white, padding: 16, borderRadius: 12, borderWidth: 1, borderColor: COLORS.border, gap: 16 },
    fileIconBox: { width: 50, height: 50, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
    fileName: { fontSize: 15, fontWeight: '600', color: COLORS.textDark, marginBottom: 2 },
    fileAction: { fontSize: 13, color: COLORS.primary, fontWeight: '500' },
});
