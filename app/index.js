import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity, Alert } from 'react-native';
import { ProgressBar, FAB, IconButton } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRouter } from 'expo-router';
import { DrawerActions } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useState } from 'react';
import { useCarContext } from '../context/CarContext';
import * as ImagePicker from 'expo-image-picker';

// Improved Color Palette
const COLORS = {
  primary: "#1d72d3",
  background: "#f8f9fa",  // Slightly warmer gray
  textDark: "#111417",
  textGray: "#647487",
  white: "#FFFFFF",
  green: "#22c55e",
  orange: "#f97316",
  red: "#ef4444",
  // Category Colors
  fuel: "#3b82f6",
  service: "#f97316",
};

export default function Dashboard() {
  const navigation = useNavigation();
  const router = useRouter();
  const { history, carProfile, updateCarProfile } = useCarContext();
  const [imageError, setImageError] = useState(false);

  // --- CAR DATA (From Profile) ---
  const carData = {
    name: (carProfile?.make && carProfile?.model)
      ? `${carProfile.make} ${carProfile.model}`
      : "Araç Bilgisi Giriniz",
    plate: carProfile?.plate || "34 XX 000",
    image: carProfile?.carImage || null  // Use user's photo or null for placeholder
  };



  const handleOpenDrawer = () => {
    navigation.dispatch(DrawerActions.openDrawer());
  };

  const pickCarImage = async () => {
    try {
      let result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [16, 9],
        quality: 0.7,
      });

      if (!result.canceled) {
        const uri = result.assets[0].uri;
        // Auto-save to profile
        await updateCarProfile({ carImage: uri });
      }
    } catch (error) {
      console.error('Pick car image error:', error);
      Alert.alert("Hata", "Fotoğraf seçilirken bir hata oluştu.");
    }
  };

  // --- HELPER FUNCTIONS ---
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

  // 1. Son Kaydedilen KM (Tarihe göre en güncel kaydı bul)
  const lastKm = useMemo(() => {
    if (history.length === 0) return "0 KM";

    // Sort logic to find the latest date
    const sorted = [...history].sort((a, b) => parseDate(b.date) - parseDate(a.date));
    return sorted[0].km + " KM";
  }, [history]);

  // 2. Toplam Harcama (Tüm kayıtlar)
  const totalSpending = useMemo(() => {
    const total = history.reduce((sum, record) => {
      const cost = parseFloat(record.cost) || 0;
      return sum + cost;
    }, 0);

    return total.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' });
  }, [history]);

  // 3. Durum Özeti Hesaplama
  const statusList = useMemo(() => {
    // Helper to find latest record by keyword or type
    const findLatest = (keyword, type = null) => {
      const filtered = history.filter(item => {
        // Check both type and subType for match
        const matchesType = type ? (item.type === type || item.subType === type) : true;

        // If no keyword is provided, we only care about the type match
        if (!keyword) return matchesType;

        const matchesKeyword = item.description
          ? item.description.toLowerCase().includes(keyword.toLowerCase())
          : false;

        return matchesType && matchesKeyword;
      });

      if (filtered.length === 0) return null;
      return filtered.sort((a, b) => parseDate(b.date) - parseDate(a.date))[0];
    };

    const calculateStatus = (title, latestRecord, validityDays) => {
      if (!latestRecord) {
        return { title, remaining: "Veri Yok", percent: 0, color: '#e0e0e0' }; // Gray
      }

      const recordDate = parseDate(latestRecord.date);
      const expiryDate = new Date(recordDate);
      expiryDate.setDate(recordDate.getDate() + validityDays);

      const daysLeft = getDaysDiff(expiryDate);
      const percent = Math.max(0, Math.min(1, daysLeft / validityDays));

      let color = COLORS.green;
      if (daysLeft < 15) color = COLORS.red;
      else if (daysLeft < 45) color = COLORS.orange;

      const remainingText = daysLeft < 0
        ? `${Math.abs(daysLeft)} Gün Geçti`
        : `${daysLeft} Gün Kaldı`;

      return { title, remaining: remainingText, percent, color };
    };

    // MTV Durumu
    // MTV Durumu
    const mtvStatus = (() => {
      const now = new Date();
      const currentYear = now.getFullYear();

      // Find all MTV records for current year
      const mtvRecords = history.filter(item => {
        const isMtv = (item.type === 'expense' && item.subType === 'mtv') ||
          (item.type === 'doc' && item.subType === 'mtv') ||
          (item.description && item.description.toLowerCase().includes('mtv'));

        if (!isMtv) return false;

        // Check legacy date or new mtvYear
        if (item.mtvYear) {
          return item.mtvYear.toString() === currentYear.toString();
        } else {
          return parseDate(item.date).getFullYear() === currentYear;
        }
      });

      // Determine paid periods
      let paidJan = false;
      let paidJul = false;

      mtvRecords.forEach(r => {
        if (r.mtvPeriods) {
          if (r.mtvPeriods.includes('jan')) paidJan = true;
          if (r.mtvPeriods.includes('jul')) paidJul = true;
        } else {
          // Legacy check
          const d = parseDate(r.date);
          if (d.getMonth() === 0) paidJan = true;
          if (d.getMonth() === 6) paidJul = true;
          // Legacy annual check
          if (r.isAnnual) { paidJan = true; paidJul = true; }
        }
      });

      const totalPaid = (paidJan ? 1 : 0) + (paidJul ? 1 : 0);
      const percent = totalPaid === 0 ? 0.1 : (totalPaid === 1 ? 0.5 : 1);

      let color = COLORS.red; // Default bad
      if (totalPaid === 2) color = COLORS.green; // All good
      else if (totalPaid === 1) color = '#facc15'; // 50% - Yellowish

      // If we are in off-season and have 0 paid, maybe gray? 
      // User Logic: "Ocak ve Temmuz seçilirse tüm bar yeşil olsun."
      // "Sadece biri seçilirse yarısı yeşil olsun." -> We used Yellow for 50% to distinguish.

      // Determine label
      let label = "Ödenmedi";
      if (totalPaid === 2) label = "Tamamlandı";
      else if (paidJan) label = "Ocak Ödendi";
      else if (paidJul) label = "Temmuz Ödendi";

      return { title: `MTV (${currentYear})`, remaining: label, percent, color };
    })();

    // Inspection Status from carProfile (not history)
    const inspectionStatus = (() => {
      if (!carProfile?.lastInspectionDate || !carProfile?.inspectionPeriodYears) {
        return { title: "Muayene", remaining: "Veri Yok", percent: 0, color: '#e0e0e0' };
      }

      const lastDate = parseDate(carProfile.lastInspectionDate);
      const periodDays = carProfile.inspectionPeriodYears * 365;
      const expiryDate = new Date(lastDate);
      expiryDate.setDate(lastDate.getDate() + periodDays);

      const daysLeft = getDaysDiff(expiryDate);
      const percent = Math.max(0, Math.min(1, daysLeft / periodDays));

      let color = COLORS.green;
      if (daysLeft < 30) color = COLORS.red;
      else if (daysLeft < 60) color = COLORS.orange;

      const remainingText = daysLeft < 0
        ? `${Math.abs(daysLeft)} Gün Geçti`
        : `${daysLeft} Gün Kaldı`;

      return { title: "Muayene", remaining: remainingText, percent, color };
    })();

    // Maintenance Status (Hybrid: Time & KM)
    const maintenanceStatus = (() => {
      // Check if maintenance settings exist
      if (!carProfile?.lastMaintenanceDate || !carProfile?.lastMaintenanceKm || !carProfile?.maintenanceIntervalKm) {
        // Fallback to legacy check if settings missing
        return calculateStatus("Periyodik Bakım", findLatest("", "service"), 365);
      }

      // 1. Time Calculation (1 Year)
      const lastDate = parseDate(carProfile.lastMaintenanceDate);
      const targetDate = new Date(lastDate);
      targetDate.setDate(lastDate.getDate() + 365);
      const daysLeft = getDaysDiff(targetDate);
      const timePercent = Math.max(0, Math.min(1, daysLeft / 365));

      // 2. KM Calculation
      // Current KM is max of (History Max KM, Last Maintenance KM)
      // Parse helper: "120.500" -> 120500
      const parseKm = (kmStr) => parseFloat(String(kmStr).replace(/\./g, '').replace(',', '.'));

      const allKms = history
        .map(r => r.km ? parseKm(r.km) : 0)
        .filter(k => k > 0);

      // Default to last maintenance KM if no history
      const currentKm = allKms.length > 0
        ? Math.max(...allKms, carProfile.lastMaintenanceKm)
        : carProfile.lastMaintenanceKm;

      const targetKm = carProfile.lastMaintenanceKm + carProfile.maintenanceIntervalKm;
      const kmLeft = targetKm - currentKm;
      const kmPercent = Math.max(0, Math.min(1, kmLeft / carProfile.maintenanceIntervalKm));

      // 3. Determine Critical Path (Lower percent = closer to expiry)
      const isTimeCritical = timePercent < kmPercent;
      const finalPercent = isTimeCritical ? timePercent : kmPercent;

      let remainingText = "";
      let color = COLORS.green;

      if (isTimeCritical) {
        remainingText = daysLeft < 0 ? `${Math.abs(daysLeft)} Gün Geçti` : `${daysLeft} Gün Kaldı`;
        if (daysLeft < 30) color = COLORS.red;
        else if (daysLeft < 60) color = COLORS.orange;
      } else {
        remainingText = kmLeft < 0 ? `${Math.abs(kmLeft).toLocaleString('tr-TR')} KM Geçti` : `${kmLeft.toLocaleString('tr-TR')} KM Kaldı`;
        if (kmLeft < 1000) color = COLORS.red;
        else if (kmLeft < 3000) color = COLORS.orange;
      }

      return { title: "Periyodik Bakım", remaining: remainingText, percent: finalPercent, color };
    })();

    return [
      calculateStatus("Sigorta", findLatest("", "insurance"), 365),
      calculateStatus("Kasko", findLatest("", "kasko"), 365),
      inspectionStatus,
      mtvStatus,
      maintenanceStatus
    ];
  }, [history, carProfile]);

  // 4. MTV Uyarısı Kontrolü
  // 4. MTV Uyarısı Kontrolü
  const mtvAlert = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth(); // 0 = Jan, 6 = July
    const currentYear = now.getFullYear();

    // Sadece Ocak (0) ve Temmuz (6) aylarında kontrol et
    if (currentMonth !== 0 && currentMonth !== 6) return null;

    const periodName = currentMonth === 0 ? "Ocak" : "Temmuz";
    const requiredPeriod = currentMonth === 0 ? 'jan' : 'jul';

    // İlgili dönem ödenmiş mi?
    const isPaid = history.some(item => {
      const isMtv = (item.type === 'expense' && item.subType === 'mtv') ||
        (item.type === 'doc' && item.subType === 'mtv') ||
        (item.description && item.description.toLowerCase().includes('mtv'));

      if (!isMtv) return false;

      // Check year
      let itemYear = parseDate(item.date).getFullYear();
      if (item.mtvYear) itemYear = parseInt(item.mtvYear);

      if (itemYear !== currentYear) return false;

      // Check period
      if (item.mtvPeriods && item.mtvPeriods.includes(requiredPeriod)) return true;

      // Legacy checks
      const d = parseDate(item.date);
      if (!item.mtvPeriods && d.getMonth() === currentMonth) return true;
      if (item.isAnnual) return true;

      return false;
    });

    if (isPaid) return null;

    return {
      message: `MTV Ödeme Dönemi! (${periodName} Ayı)`,
      type: 'warning'
    };
  }, [history]);

  // 5. Muayene Uyarısı Kontrolü (carProfile-based)
  const inspectionAlert = useMemo(() => {
    if (!carProfile?.lastInspectionDate || !carProfile?.inspectionPeriodYears) {
      return null;
    }

    const lastDate = parseDate(carProfile.lastInspectionDate);
    const periodDays = carProfile.inspectionPeriodYears * 365;
    const expiryDate = new Date(lastDate);
    expiryDate.setDate(lastDate.getDate() + periodDays);

    const daysLeft = getDaysDiff(expiryDate);

    if (daysLeft <= 30 && daysLeft >= 0) {
      return { message: `Muayene Yaklaşıyor! (${daysLeft} Gün)`, type: 'warning' };
    }
    if (daysLeft < 0) {
      return { message: `Muayene Süresi Geçti!`, type: 'error' };
    }
    return null;
  }, [carProfile]);

  // Combine Active Alerts
  const activeAlerts = [mtvAlert, inspectionAlert].filter(Boolean);

  // 6. Finansal Özet (Yıllık Toplam & Tüketim)
  const financialSummary = useMemo(() => {
    const currentYear = new Date().getFullYear();

    // A) Yıllık Toplam
    const annualRecords = history.filter(r => parseDate(r.date).getFullYear() === currentYear);
    const totalAnnual = annualRecords.reduce((sum, r) => sum + (parseFloat(r.cost) || 0), 0);

    // B) Yakıt Tüketimi Metrikleri
    const fuelRecords = history
      .filter(r => r.type === 'fuel' && r.km && r.cost)
      .sort((a, b) => parseFloat(String(a.km).replace('.', '')) - parseFloat(String(b.km).replace('.', '')));

    let avgCostPerKm = "Veri Yok"; // TL/km
    let avgLitersPer100km = "Veri Yok"; // L/100km

    if (fuelRecords.length >= 2) {
      // KM parse helper (124.500 -> 124500)
      const parseKm = (kmStr) => parseFloat(String(kmStr).replace(/\./g, '').replace(',', '.'));

      const first = fuelRecords[0];
      const last = fuelRecords[fuelRecords.length - 1];
      const deltaKm = parseKm(last.km) - parseKm(first.km);

      if (deltaKm > 0) {
        // TL/km: Toplam maliyet / Gidilen mesafe
        const totalFuelCost = fuelRecords.reduce((sum, r) => sum + (parseFloat(r.cost) || 0), 0);
        avgCostPerKm = `${(totalFuelCost / deltaKm).toFixed(2)} TL/km`;

        // L/100km: (Toplam litre / Gidilen mesafe) * 100
        const totalLiters = fuelRecords.reduce((sum, r) => sum + (parseFloat(r.liters) || 0), 0);
        if (totalLiters > 0) {
          avgLitersPer100km = `${((totalLiters / deltaKm) * 100).toFixed(1)} L/100km`;
        }
      }
    }

    return {
      annualTotal: totalAnnual.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' }),
      avgCostPerKm,
      avgLitersPer100km
    };
  }, [history]);


  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>

      {/* 1. HEADER (ÜST BAR) */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.menuButton} onPress={handleOpenDrawer}>
          <IconButton icon="menu" size={24} iconColor={COLORS.textDark} />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>Garajım</Text>

        <View style={styles.avatarContainer}>
          <TouchableOpacity onPress={() => router.push('/report')} style={{ marginRight: 8 }}>
            <MaterialCommunityIcons name="file-document-outline" size={24} color={COLORS.textGray} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => router.push('/settings')}>
            <Image
              source={{ uri: "https://lh3.googleusercontent.com/aida-public/AB6AXuChplR9slGNSD2n4I69k6u2GZx7v4whF9GR0bHFLh3j0Qk7k5ZPV5eOThiKmdlN6SbVIHmveWpp1NLsLCDfkVAQ95AsDoxarA6N3WN6I-XYT_H3acsKNTQc3S8IpJL4dmkOyGd2z_TlxsWHKRTChby68ptlqYMOtFv3vt9OgGKQtJ7c2Nj29pMVKjIJ_CGn-AZ0TntSLrtgpn_P2zXZBsJmyT_uwwL0jve0TIqD5_I0OIlsV9hPYCbwtrrygkU3lq7a8fx16W1-Yjs" }}
              style={styles.avatar}
            />
          </TouchableOpacity>
        </View>
      </View>

      {/* ALERTS SECTION */}
      <View style={{ gap: 8 }}>
        {activeAlerts.map((alert, index) => (
          <View key={index} style={[styles.alertContainer, alert.type === 'error' && { backgroundColor: '#ef4444' }]}>
            <MaterialCommunityIcons name="alert-circle" size={20} color={COLORS.white} />
            <Text style={styles.alertText}>{alert.message}</Text>
          </View>
        ))}
      </View>



      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

        {/* 2. ARAÇ KARTI (HERO SECTION) */}
        <View style={styles.cardContainer}>
          <View style={styles.card}>
            {/* Araç Fotosu */}
            <TouchableOpacity onPress={pickCarImage} activeOpacity={0.9}>
              {(!carData.image || imageError) ? (
                <View style={[styles.cardImage, { backgroundColor: '#f5f5f5', alignItems: 'center', justifyContent: 'center' }]}>
                  <MaterialCommunityIcons name="car-hatchback" size={100} color="#e0e0e0" />
                  <View style={{ position: 'absolute', bottom: 10, right: 10, backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: 20, padding: 6 }}>
                    <MaterialCommunityIcons name="camera-plus" size={20} color={COLORS.white} />
                  </View>
                </View>
              ) : (
                <View>
                  <Image
                    source={{ uri: carData.image }}
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
              <Text style={styles.carName}>{carData.name}</Text>

              <View style={styles.carDetailsRow}>
                <View style={styles.plateBox}>
                  <Text style={styles.plateText}>{carData.plate}</Text>
                </View>
                <View style={styles.kmBox}>
                  <MaterialCommunityIcons name="speedometer" size={16} color={COLORS.textGray} style={{ marginRight: 4 }} />
                  <Text style={styles.kmText}>{lastKm}</Text>
                </View>
              </View>

              {/* Bu Ayki Harcama */}
              {/* YENİ FİNANSAL ÖZET */}
              <View style={styles.finContainer}>
                <View style={styles.finItem}>
                  <Text style={styles.finLabel}>Bu Yıl Toplam</Text>
                  <Text style={styles.finValueMain}>{financialSummary.annualTotal}</Text>
                </View>
                <View style={styles.finItem}>
                  <Text style={styles.finLabel}>Yakıt</Text>
                  <Text style={styles.finValueSub}>{financialSummary.avgLitersPer100km}</Text>
                </View>
                <View style={[styles.finItem, { alignItems: 'flex-end' }]}>
                  <Text style={styles.finLabel}>Maliyet</Text>
                  <Text style={styles.finValueSub}>{financialSummary.avgCostPerKm}</Text>
                </View>
              </View>
            </View>
          </View>
        </View>

        {/* 3. DURUM ÖZETİ (STATUS BARS) */}
        <Text style={styles.sectionTitle}>Durum Özeti</Text>

        <View style={styles.statusSection}>
          {statusList.map((item, index) => (
            <View key={index} style={styles.statusItem}>
              <View style={styles.statusHeader}>
                <Text style={styles.statusTitle}>{item.title}</Text>
                <Text style={styles.statusRemaining}>{item.remaining}</Text>
              </View>
              {/* Progress Bar */}
              <ProgressBar
                progress={item.percent}
                color={item.color}
                style={styles.progressBar}
              />
            </View>
          ))}
        </View>

        {/* ScrollView altında boşluk bırakıyoruz ki FAB içeriği kapatmasın */}
        <View style={{ height: 80 }} />
      </ScrollView>

      {/* 4. FAB BUTON (SAĞ ALT) */}
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
  // HEADER
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: COLORS.background,
    // Hafif bir border bottom
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

  // SCROLL CONTENT
  scrollContent: {
    paddingTop: 16,
  },

  // ARAÇ KARTI
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
    elevation: 3, // Android gölgesi
  },
  cardImage: {
    width: '100%',
    height: 200, // HTML'deki aspect-video karşılığı yaklaşık
  },
  cardContent: {
    padding: 16,
  },
  carName: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.textDark,
    marginBottom: 8,
  },
  carDetailsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16, // Altına harcama kısmı geleceği için boşluk
    gap: 12,
  },
  plateBox: {
    borderWidth: 1,
    borderColor: '#d1d5db', // gray-300
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  plateText: {
    fontSize: 16,
    fontWeight: '400',
    color: COLORS.textGray,
  },
  kmBox: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  kmText: {
    fontSize: 16,
    fontWeight: '400',
    color: COLORS.textGray,
  },

  // SPENDING SECTION
  spendingContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6', // gray-100
  },
  spendingLabel: {
    fontSize: 14,
    color: COLORS.textGray,
    fontWeight: '500',
  },
  spendingValue: {
    fontSize: 18,
    color: COLORS.primary,
    fontWeight: '700',
  },

  // STATUS SECTION
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.textDark,
    marginBottom: 16,
    paddingHorizontal: 16,
  },
  statusSection: {
    paddingHorizontal: 16,
    gap: 16, // Elemanlar arası boşluk
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
    color: COLORS.textGray,
  },
  progressBar: {
    height: 6,
    borderRadius: 3,
    backgroundColor: '#e5e7eb', // gray-200 (boş kısım rengi)
  },

  // ALERT
  alertContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.red,
    padding: 12,
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 8,
    gap: 8,
  },
  alertText: {
    color: COLORS.white,
    fontWeight: '600',
    fontSize: 14,
  },

  // FINANCIAL SUMMARY (Small Card)
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
    color: COLORS.primary, // or Orange
  },

  // FAB
  fab: {
    position: 'absolute',
    margin: 24,
    right: 0,
    bottom: 0,
    backgroundColor: COLORS.primary,
    borderRadius: 16,
  },
});
