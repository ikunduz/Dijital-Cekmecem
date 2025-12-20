import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, Modal, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Icon, Surface } from 'react-native-paper';
import { useRouter } from 'expo-router';
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

export default function History() {
  const router = useRouter();
  const { history, deleteRecord } = useHomeContext();
  const [previewItem, setPreviewItem] = useState(null);

  // Show all history sorted by date
  const records = [...history].sort((a, b) => {
    // Parse DD.MM.YYYY
    const dateA = a.date.split('.').reverse().join('-');
    const dateB = b.date.split('.').reverse().join('-');
    return new Date(dateB) - new Date(dateA);
  });

  const getIcon = (type) => {
    switch (type) {
      case 'bill': return 'receipt';
      case 'warranty': return 'shield-check';
      case 'doc': return 'file-document';
      default: return 'history';
    }
  };

  const isPdfFile = (uri) => uri && (uri.toLowerCase().includes('.pdf') || uri.includes('pdf'));

  const openPdf = async (uri) => {
    try {
      const isAvailable = await Sharing.isAvailableAsync();
      if (isAvailable) {
        await Sharing.shareAsync(uri, { mimeType: 'application/pdf', dialogTitle: 'PDF Dosyasını Aç' });
      } else {
        Alert.alert('Hata', 'Paylaşım desteklenmiyor.');
      }
    } catch (error) {
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

  const getRecordTitle = (item) => {
    if (item.type === 'bill') return 'Fatura';
    if (item.type === 'warranty') return item.productName || 'Garanti';
    if (item.type === 'doc') return 'Resmi Belge';
    return 'Kayıt';
  };

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
            <Text style={styles.cardTitle}>{getRecordTitle(item)}</Text>
            <Text style={styles.cardDate}>{item.date}</Text>
          </View>
        </View>
      </TouchableOpacity>

      <View style={styles.cardRight}>
        {item.cost && <Text style={styles.cardCost}>{item.cost} ₺</Text>}
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
    <SafeAreaView style={[styles.container, { backgroundColor: COLORS.background }]} edges={['top', 'left', 'right']}>
      {/* HEADER */}
      <View style={[styles.header, { backgroundColor: COLORS.surface, borderBottomColor: COLORS.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Icon source="arrow-left" size={24} color={COLORS.textDark} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: COLORS.textDark }]}>Tüm İşlem Geçmişi</Text>
        <TouchableOpacity onPress={() => router.push({ pathname: '/add-record' })} style={styles.backButton}>
          <Icon source="plus" size={24} color={COLORS.primary} />
        </TouchableOpacity>
      </View>

      {records.length === 0 ? (
        <View style={styles.emptyContainer}>
          <View style={[styles.emptyIconCircle, { backgroundColor: COLORS.surface }]}>
            <Icon source="history" size={48} color={COLORS.textGray} />
          </View>
          <Text style={[styles.emptyTitle, { color: COLORS.textDark }]}>Henüz kayıt yok</Text>
        </View>
      ) : (
        <FlatList
          data={records}
          keyExtractor={item => item.id.toString()}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
        />
      )}

      {/* Basic Preview Modal (Simplified for generic usage) */}
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
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Tarih</Text>
                  <Text style={styles.detailValue}>{previewItem.date}</Text>
                </View>
                {previewItem.cost && (
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Tutar</Text>
                    <Text style={styles.detailValue}>{previewItem.cost} ₺</Text>
                  </View>
                )}
                {previewItem.description && (
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Açıklama</Text>
                    <Text style={styles.detailValue}>{previewItem.description}</Text>
                  </View>
                )}
              </View>

              {previewItem.image ? (
                <View style={styles.fileSection}>
                  <Text style={styles.sectionTitle}>Dosya</Text>
                  <TouchableOpacity
                    style={styles.fileButton}
                    onPress={() => isPdfFile(previewItem.image) ? openPdf(previewItem.image) : openImage(previewItem.image)}
                  >
                    <Text>Dosyayı Görüntüle</Text>
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
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1 },
  headerTitle: { fontSize: 18, fontWeight: '700' },
  backButton: { padding: 8, marginHorizontal: -8 },
  listContent: { padding: 16 },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingBottom: 100 },
  emptyIconCircle: { width: 100, height: 100, borderRadius: 50, justifyContent: 'center', alignItems: 'center', marginBottom: 24 },
  emptyTitle: { fontSize: 20, fontWeight: '700' },
  card: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, marginBottom: 12, borderRadius: 12 },
  cardLeft: { flexDirection: 'row', alignItems: 'center' },
  iconBox: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  cardTitle: { fontSize: 16, fontWeight: '600' },
  cardDate: { fontSize: 13, marginTop: 2 },
  cardRight: { alignItems: 'flex-end', gap: 8 },
  iconBtn: { padding: 4 },
  cardCost: { fontSize: 16, fontWeight: '700' },
  modalContainer: { flex: 1 },
  modalContent: { flex: 1 },
  modalScrollContent: { padding: 20 },
  detailsContainer: { borderRadius: 12, padding: 16, marginBottom: 20 },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 12, borderBottomWidth: 1 },
  detailLabel: {},
  detailValue: { fontWeight: '600', textAlign: 'right', flex: 1, marginLeft: 16 },
  fileSection: { marginBottom: 20 },
  sectionTitle: { fontSize: 16, fontWeight: '700', marginBottom: 12 },
  fileButton: { padding: 16, borderRadius: 12, alignItems: 'center', borderWidth: 1 },
});
