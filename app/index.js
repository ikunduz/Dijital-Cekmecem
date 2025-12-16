import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity, Alert } from 'react-native';
import { ProgressBar, FAB, IconButton } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRouter } from 'expo-router';
import { DrawerActions } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useHomeContext } from '../context/HomeContext';
import * as ImagePicker from 'expo-image-picker';

// Improved Color Palette
const COLORS = {
  primary: "#F57C00", // Home Orange
  background: "#E5E7EB",
  textDark: "#111417",
  textGray: "#647487",
  white: "#FFFFFF",
  green: "#22c55e",
  orange: "#f97316",
  red: "#ef4444",
  // Category Colors
  bill: "#3b82f6",
  warranty: "#8b5cf6",
};

export default function Dashboard() {
  const navigation = useNavigation();
  const router = useRouter();
  const { history, homeProfile, updateHomeProfile } = useHomeContext();
  const [imageError, setImageError] = useState(false);

  // --- HOME DATA ---
  const homeData = {
    name: homeProfile?.title || "Evim",
    address: homeProfile?.address || "Adres Girilmemiş",
    image: homeProfile?.homeImage || null
  };

  const handleOpenDrawer = () => {
    navigation.dispatch(DrawerActions.openDrawer());
  };

  const pickHomeImage = async () => {
    try {
      let result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: 'Images',
        allowsEditing: true,
        aspect: [16, 9],
        quality: 0.7,
      });

      if (!result.canceled) {
        const uri = result.assets[0].uri;
        await updateHomeProfile({ homeImage: uri });
      }
    } catch (error) {
      console.error('Pick home image error:', error);
      Alert.alert("Hata", "Fotoğraf seçilirken bir hata oluştu: " + error.message);
    }
  };

  const parseDate = (dateStr) => {
    if (!dateStr) return new Date(0);
    const parts = dateStr.split('.');
    if (parts.length === 3) {
      return new Date(parts[2], parts[1] - 1, parts[0]);
    }
    return new Date();
  };

  const getDaysDiff = (targetDate) => {
    const now = new Date();
    const diffTime = targetDate - now;
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  // 1. Total Monthly Bill Average 
  // Simplified logic: Average of last 3 months total bills? Or just Total Bills this year / current month count?
  // Let's do: Average Monthly Bill (based on all history or last 6 months)
  const monthlyAverage = useMemo(() => {
    const billRecords = history.filter(r => r.type === 'bill' && r.cost);
    if (billRecords.length === 0) return "0 ₺";

    const totalCost = billRecords.reduce((sum, r) => sum + parseFloat(r.cost), 0);
    // Find unique months
    const months = new Set(billRecords.map(r => {
      const d = parseDate(r.date);
      return `${d.getFullYear()}-${d.getMonth()}`;
    }));

    const count = months.size || 1;
    const avg = totalCost / count;
    return avg.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' });
  }, [history]);

  // 2. Status Bars (Upcoming Payments & Ending Warranties)
  const statusList = useMemo(() => {
    const statuses = [];

    // A) Upcoming Bill Payments (based on Due Date)
    // Find bills with dueDate in future or recent past (unpaid check logic is missing, assuming all added are 'records' but maybe 'unpaid' status needed? 
    // The prompt implies "Upcoming Payments", maybe we check bills entered as "Unpaid"? 
    // Data model doesn't explicitly have "Paid" status. 
    // Let's assume we show "Upcoming Bills" based on `dueDate` of RECENT bills if date > today? 
    // Or maybe just show "Next Bill" if we had recurring logic.
    // Let's repurpose this to: "Yaklaşan Ödemeler" -> finding bills with due date > today? 
    // If no unpaid tracking, maybe we show "Warranty Expirations"?

    // Let's implement Top 3 items:
    // 1. Warranty Expirations
    const warranties = history.filter(r => r.type === 'warranty' && (r.date)); // r.date is Warranty End Date
    warranties.forEach(w => {
      const endDate = parseDate(w.date);
      const daysLeft = getDaysDiff(endDate);
      if (daysLeft > -30) { // Show if expired recently or future
        statuses.push({
          id: w.id,
          title: `${w.productName || 'Ürün'} Garantisi`,
          daysLeft,
          type: 'warranty'
        });
      }
    });

    // 2. Official Doc Expirations (e.g. DASK, Insurance)
    const docs = history.filter(r => r.type === 'doc' && (r.subType === 'dask' || r.subType === 'insurance'));
    docs.forEach(d => {
      // Assume 1 year validity for DASK/Insurance if not specified? 
      // Or if user entered specific End Date? The form currently asks "Date" (Start Date).
      // Let's assume 1 year from Date.
      const startDate = parseDate(d.date);
      const endDate = new Date(startDate);
      endDate.setFullYear(startDate.getFullYear() + 1);
      const daysLeft = getDaysDiff(endDate);

      statuses.push({
        id: d.id,
        title: d.subType === 'dask' ? 'DASK Süresi' : 'Sigorta Süresi',
        daysLeft,
        type: 'doc'
      });
    });

    // Sort by urgency (lowest days left)
    statuses.sort((a, b) => a.daysLeft - b.daysLeft);

    // Map to display format
    return statuses.slice(0, 5).map(s => {
      let color = COLORS.green;
      let percent = Math.max(0, Math.min(1, s.daysLeft / 365)); // visual approx

      if (s.daysLeft < 0) color = COLORS.red;
      else if (s.daysLeft < 30) color = COLORS.orange;

      const remainingText = s.daysLeft < 0
        ? `${Math.abs(s.daysLeft)} Gün Geçti`
        : `${s.daysLeft} Gün Kaldı`;

      return {
        title: s.title,
        remaining: remainingText,
        percent,
        color
      };
    });
  }, [history]);

  // Financial Summary (This Year)
  const financialSummary = useMemo(() => {
    const currentYear = new Date().getFullYear();
    const annualRecords = history.filter(r => parseDate(r.date).getFullYear() === currentYear);
    const totalAnnual = annualRecords.reduce((sum, r) => sum + (parseFloat(r.cost) || 0), 0);

    // Bill specific
    const billTotal = annualRecords
      .filter(r => r.type === 'bill')
      .reduce((sum, r) => sum + (parseFloat(r.cost) || 0), 0);

    return {
      annualTotal: totalAnnual.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' }),
      billTotal: billTotal.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' }),
    };
  }, [history]);


  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>

      {/* 1. HEADER */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.menuButton} onPress={handleOpenDrawer}>
          <IconButton icon="menu" size={24} iconColor={COLORS.textDark} />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>Evim</Text>

        <View style={styles.avatarContainer}>
          <TouchableOpacity onPress={() => router.push('/settings')}>
            <Image
              source={{ uri: "https://lh3.googleusercontent.com/aida-public/AB6AXuChplR9slGNSD2n4I69k6u2GZx7v4whF9GR0bHFLh3j0Qk7k5ZPV5eOThiKmdlN6SbVIHmveWpp1NLsLCDfkVAQ95AsDoxarA6N3WN6I-XYT_H3acsKNTQc3S8IpJL4dmkOyGd2z_TlxsWHKRTChby68ptlqYMOtFv3vt9OgGKQtJ7c2Nj29pMVKjIJ_CGn-AZ0TntSLrtgpn_P2zXZBsJmyT_uwwL0jve0TIqD5_I0OIlsV9hPYCbwtrrygkU3lq7a8fx16W1-Yjs" }}
              style={styles.avatar}
            />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

        {/* 2. EV KARTI (HERO SECTION) */}
        <View style={styles.cardContainer}>
          <View style={styles.card}>
            {/* Ev Fotosu */}
            <TouchableOpacity onPress={pickHomeImage} activeOpacity={0.9}>
              {(!homeData.image || imageError) ? (
                <View style={[styles.cardImage, { backgroundColor: '#f5f5f5', alignItems: 'center', justifyContent: 'center' }]}>
                  <MaterialCommunityIcons name="home" size={100} color="#e0e0e0" />
                  <View style={{ position: 'absolute', bottom: 10, right: 10, backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: 20, padding: 6 }}>
                    <MaterialCommunityIcons name="camera-plus" size={20} color={COLORS.white} />
                  </View>
                </View>
              ) : (
                <View>
                  <Image
                    source={{ uri: homeData.image }}
                    style={styles.cardImage}
                    resizeMode="cover"
                    onError={() => setImageError(true)}
                  />
                  <View style={{ position: 'absolute', bottom: 10, right: 10, backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: 20, padding: 6 }}>
                    <MaterialCommunityIcons name="pencil" size={20} color={COLORS.white} />
                  </View>
                </View>
              )}
            </TouchableOpacity>

            {/* Kart İçeriği */}
            <View style={styles.cardContent}>
              <Text style={styles.homeName}>{homeData.name}</Text>
              <Text style={styles.addressText}>{homeData.address}</Text>

              {/* İstatistikler */}
              <View style={styles.statsContainer}>
                <View style={styles.statBox}>
                  <Text style={styles.statLabel}>Aylık Fatura Ort.</Text>
                  <Text style={styles.statValue}>{monthlyAverage}</Text>
                </View>
              </View>

              {/* Alt Bilgi */}
              <View style={styles.finContainer}>
                <View style={styles.finItem}>
                  <Text style={styles.finLabel}>Bu Yıl Toplam</Text>
                  <Text style={styles.finValueMain}>{financialSummary.annualTotal}</Text>
                </View>
                <View style={[styles.finItem, { alignItems: 'flex-end' }]}>
                  <Text style={styles.finLabel}>Fatura Toplamı</Text>
                  <Text style={styles.finValueSub}>{financialSummary.billTotal}</Text>
                </View>
              </View>
            </View>
          </View>
        </View>

        {/* 3. DURUM ÖZETİ (STATUS BARS) */}
        <Text style={styles.sectionTitle}>Yaklaşan Ödemeler / Garantiler</Text>

        <View style={styles.statusSection}>
          {statusList.length === 0 ? (
            <Text style={styles.emptyStatusText}>Yaklaşan ödeme veya biten garanti yok.</Text>
          ) : (
            statusList.map((item, index) => (
              <View key={index} style={styles.statusItem}>
                <View style={styles.statusHeader}>
                  <Text style={styles.statusTitle}>{item.title}</Text>
                  <Text style={[styles.statusRemaining, { color: item.color }]}>{item.remaining}</Text>
                </View>
                <ProgressBar
                  progress={item.percent}
                  color={item.color}
                  style={styles.progressBar}
                />
              </View>
            ))
          )}
        </View>

        <View style={{ height: 80 }} />
      </ScrollView>

      {/* 4. FAB BUTON */}
      <FAB
        icon="plus"
        color="white"
        style={styles.fab}
        onPress={() => router.push('/add-record')}
      />

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
    backgroundColor: COLORS.background,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  menuButton: {
    width: 40,
    alignItems: 'flex-start',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.textDark,
  },
  avatarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  scrollContent: {
    paddingTop: 16,
  },
  cardContainer: {
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardImage: {
    width: '100%',
    height: 200,
  },
  cardContent: {
    padding: 16,
  },
  homeName: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.textDark,
    marginBottom: 4,
  },
  addressText: {
    fontSize: 14,
    color: COLORS.textGray,
    marginBottom: 16,
  },
  statsContainer: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  statBox: {
    padding: 8,
    backgroundColor: '#fff7ed', // orange-50
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ffedd5',
  },
  statLabel: {
    fontSize: 12,
    color: COLORS.textGray,
    marginBottom: 2,
  },
  statValue: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.primary,
  },

  // STATUS
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.textDark,
    marginBottom: 16,
    paddingHorizontal: 16,
  },
  statusSection: {
    paddingHorizontal: 16,
    gap: 16,
  },
  statusItem: {
    backgroundColor: COLORS.white,
    padding: 16,
    borderRadius: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  statusHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  statusTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: COLORS.textDark,
  },
  statusRemaining: {
    fontSize: 14,
    fontWeight: '600',
  },
  progressBar: {
    height: 6,
    borderRadius: 3,
    backgroundColor: '#e5e7eb',
  },
  emptyStatusText: {
    color: COLORS.textGray,
    fontStyle: 'italic',
    textAlign: 'center'
  },

  // FIN SUMMARY
  finContainer: {
    flexDirection: 'row',
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
    justifyContent: 'space-between',
  },
  finItem: {
    flex: 1,
  },
  finLabel: {
    fontSize: 12,
    color: COLORS.textGray,
    marginBottom: 4,
  },
  finValueMain: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.textDark,
  },
  finValueSub: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.primary,
  },

  fab: {
    position: 'absolute',
    margin: 24,
    right: 0,
    bottom: 0,
    backgroundColor: COLORS.primary,
    borderRadius: 16,
  },
});
