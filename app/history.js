import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, Modal, ScrollView, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Icon, Surface } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { useCarContext } from '../context/CarContext';
import * as Sharing from 'expo-sharing';

const COLORS = {
  primary: "#1d72d3",
  background: "#f6f7f8",
  textDark: "#111417",
  textGray: "#647487",
  white: "#FFFFFF",
  border: "#e5e7eb",
  danger: "#ef4444",
};

export default function History() {
  const router = useRouter();
  const { history, deleteRecord } = useCarContext();
  const [previewItem, setPreviewItem] = useState(null);

  // Filter only service/maintenance records
  const serviceRecords = history.filter(r => r.type === 'service');

  const getIcon = (type) => {
    switch (type) {
      case 'fuel': return 'gas-station';
      case 'service': return 'wrench';
      case 'doc': return 'file-document';
      case 'expense': return 'cash';
      default: return 'history';
    }
  };

  // Helper to check if file is PDF
  const isPdfFile = (uri) => {
    if (!uri) return false;
    return uri.toLowerCase().includes('.pdf') || uri.includes('pdf');
  };

  // Helper to open PDF
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

  // Helper to open Image
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
            if (previewItem?.id === item.id) {
              setPreviewItem(null);
            }
          }
        }
      ]
    );
  };

  const getRecordInfo = (item) => {
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
    // Fallback
    return {
      title: 'Kayıt Detayı',
      lines: [
        { label: 'Tarih', value: item.date },
        item.description ? { label: 'Açıklama', value: item.description } : null,
      ].filter(Boolean)
    };
  }

  const renderItem = ({ item }) => (
    <Surface style={styles.card} elevation={1}>
      <TouchableOpacity
        style={{ flex: 1, flexDirection: 'row', alignItems: 'center' }}
        onPress={() => setPreviewItem(item)}
      >
        <View style={styles.cardLeft}>
          <View style={styles.iconBox}>
            <Icon source={getIcon(item.type)} size={24} color={COLORS.primary} />
          </View>
          <View>
            <Text style={styles.cardTitle}>{item.description || "Periyodik Bakım"}</Text>
            <Text style={styles.cardDate}>{item.date} • {item.km} KM</Text>
          </View>
        </View>
      </TouchableOpacity>

      <View style={styles.cardRight}>
        <Text style={styles.cardCost}>{item.cost} ₺</Text>
        {/* Keeping the edit button on the card for quick access, but removing delete to prioritize detail view */}
        <TouchableOpacity
          onPress={() => router.push({ pathname: '/add-record', params: { recordId: item.id } })}
          style={styles.iconBtn}
        >
          <Icon source="pencil" size={20} color={COLORS.textGray} />
        </TouchableOpacity>
      </View>
    </Surface>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>

      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Icon source="arrow-left" size={24} color={COLORS.textDark} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Servis Geçmişi</Text>
        <TouchableOpacity onPress={() => router.push({ pathname: '/add-record' })} style={styles.backButton}>
          <Icon source="plus" size={24} color={COLORS.primary} />
        </TouchableOpacity>
      </View>

      {/* CONTENT */}
      {serviceRecords.length === 0 ? (
        <View style={styles.emptyContainer}>
          <View style={styles.emptyIconCircle}>
            <Icon source="wrench" size={48} color={COLORS.textGray} />
          </View>
          <Text style={styles.emptyTitle}>Henüz servis kaydı yok</Text>
          <Text style={styles.emptySubtitle}>
            Kayıt eklemek için sağ üstteki + butonunu kullanın.
          </Text>
        </View>
      ) : (
        <FlatList
          data={serviceRecords}
          keyExtractor={item => item.id.toString()}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
        />
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
    padding: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingBottom: 100,
  },
  emptyIconCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
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
    marginBottom: 24,
  },

  // CARD
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.white,
    padding: 16,
    marginBottom: 12,
    borderRadius: 12,
  },
  cardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#e6f0fa',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.textDark,
  },
  cardDate: {
    fontSize: 13,
    color: COLORS.textGray,
    marginTop: 2,
  },
  cardRight: {
    alignItems: 'flex-end',
    gap: 8,
  },
  iconBtn: {
    padding: 4,
  },
  cardCost: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.primary,
  },

  // MODAL & DETAILS
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
    backgroundColor: COLORS.white,
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
