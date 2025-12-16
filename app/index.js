import React, { useMemo, useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity, RefreshControl } from 'react-native';
import { FAB, IconButton } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRouter } from 'expo-router';
import { DrawerActions } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';



import { useHomeContext } from '../context/HomeContext';
import HealthRing from '../components/HealthRing';
import DrawerGrid from '../components/DrawerGrid';
import { getSeasonalTip, analyzeBillTrends } from '../utils/smartLogic';

const COLORS = {
  primary: "#F57C00",
  background: "#F0F2F5",
  textDark: "#0f172a",
  textGray: "#647487",
  white: "#FFFFFF",
  success: "#22c55e",
  danger: "#ef4444",
  warning: "#f97316",
};

export default function Dashboard() {
  const navigation = useNavigation();
  const router = useRouter();
  const { history, homeProfile } = useHomeContext();
  const [refreshing, setRefreshing] = useState(false);

  // --- 1. GREETING LOGIC ---
  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return "Günaydın";
    if (hour < 18) return "Tünaydın";
    return "İyi Akşamlar";
  }, []);

  // --- 2. HOME HEALTH LOGIC ---
  const { healthScore, issues, stats } = useMemo(() => {
    let score = 100;
    const foundIssues = [];
    const now = new Date();

    // -- A. BILLS (Faturalar) --
    // Check if last bill > 45 days
    const bills = history.filter(h => h.type === 'bill');
    if (bills.length > 0) {
      // Find latest bill date
      // Date format is likely DD.MM.YYYY based on previous files, let's parse safely
      const parse = (d) => {
        const parts = d.split('.');
        return new Date(parts[2], parts[1] - 1, parts[0]);
      };
      bills.sort((a, b) => parse(b.date) - parse(a.date));
      const lastBill = bills[0];
      const diffDays = (now - parse(lastBill.date)) / (1000 * 60 * 60 * 24);

      if (diffDays > 45) {
        score -= 10;
        foundIssues.push("Fatura gecikmesi olabilir");
      }
    }
    const lastBillAmount = bills.length > 0 ? `${bills[0].cost} TL` : 'Veri Yok';

    // -- B. WARRANTIES (Garantiler) --
    const warranties = history.filter(h => h.type === 'warranty');
    let expiredWarranties = 0;
    warranties.forEach(w => {
      // Date is expiration date? Usually prompt says 'date' is Start Date. 
      // But previously we treated 'date' as End Date in statusList? 
      // Let's assume 'date' is Expiration for Warranties based on user context "Bitiş Tarihi".
      // If it's Start Date, we need duration. Let's assume the user enters Expiration Date for simplicty or 'date' field is generic.
      // Re-reading previous `index.js`: "r.date is Warranty End Date" comment.
      const parts = w.date.split('.');
      const endDate = new Date(parts[2], parts[1] - 1, parts[0]);
      if (endDate < now) {
        score -= 5;
        expiredWarranties++;
      }
    });
    if (expiredWarranties > 0) {
      foundIssues.push(`${expiredWarranties} Garanti bitti`);
    }

    // -- C. DOCS (Evraklar - DASK/Sigorta) --
    const docs = history.filter(h => h.type === 'doc' && (h.subType === 'dask' || h.subType === 'insurance'));
    let expiredDocs = 0;
    docs.forEach(d => {
      // DASK is 1 year. 'date' is Start Date.
      const parts = d.date.split('.');
      const startDate = new Date(parts[2], parts[1] - 1, parts[0]);
      const endDate = new Date(startDate);
      endDate.setFullYear(endDate.getFullYear() + 1);

      if (endDate < now) {
        score -= 20; // Critical
        expiredDocs++;
        foundIssues.push("DASK/Sigorta süresi dolmuş!");
      }
    });

    // Clamp Score
    score = Math.max(0, score);

    // Stats for Drawers
    return {
      healthScore: score,
      issues: foundIssues,
      stats: {
        billInfo: `Son: ${lastBillAmount}`,
        warrantyInfo: expiredWarranties > 0 ? `${expiredWarranties} Süresi Dolan` : 'Her şey yolunda',
        maintenanceInfo: '3 ay önce', // Mock for now or calculate from 'service' type
        docInfo: expiredDocs > 0 ? 'Yenileme Gerekli' : 'Tüm evraklar tam'
      }
    };
  }, [history]);

  // --- 3. SMART INSIGHTS LOGIC ---
  const insight = useMemo(() => {
    // 1. Check for Bill Anomalies first (High Priority)
    const billInsight = analyzeBillTrends(history);
    if (billInsight) return billInsight;

    // 2. Fallback to Seasonal Tips
    return getSeasonalTip();
  }, [history]);


  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    // Simulate fetch? Context loads automatically.
    setTimeout(() => setRefreshing(false), 1000);
  }, []);

  return (
    <View style={styles.mainContainer}>
      {/* --- 1. PREMIUM HEADER WITH GRADIENT --- */}
      <LinearGradient
        colors={['#FF9800', '#F57C00']} // Orange Gradient
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.headerBackground}
      >
        <SafeAreaView edges={['top', 'left', 'right']} style={styles.headerSafeArea}>
          <View style={styles.topBar}>
            <TouchableOpacity onPress={() => navigation.dispatch(DrawerActions.openDrawer())}>
              <IconButton icon="menu" size={28} iconColor={COLORS.white} />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => router.push('/settings')}>
              <Image
                source={{ uri: "https://lh3.googleusercontent.com/aida-public/AB6AXuChplR9slGNSD2n4I69k6u2GZx7v4whF9GR0bHFLh3j0Qk7k5ZPV5eOThiKmdlN6SbVIHmveWpp1NLsLCDfkVAQ95AsDoxarA6N3WN6I-XYT_H3acsKNTQc3S8IpJL4dmkOyGd2z_TlxsWHKRTChby68ptlqYMOtFv3vt9OgGKQtJ7c2Nj29pMVKjIJ_CGn-AZ0TntSLrtgpn_P2zXZBsJmyT_uwwL0jve0TIqD5_I0OIlsV9hPYCbwtrrygkU3lq7a8fx16W1-Yjs" }}
                style={styles.avatar}
              />
            </TouchableOpacity>
          </View>

          <View style={styles.headerContent}>
            <Text style={styles.greetingText}>{greeting},</Text>
            <Text style={styles.homeTitle}>{homeProfile?.title || 'Evim'}</Text>
          </View>
        </SafeAreaView>
      </LinearGradient>

      <ScrollView
        style={styles.contentContainer}
        contentContainerStyle={{ paddingBottom: 100 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />
        }
      >
        {/* --- 2. PULSE SECTION (Score) --- */}
        <View style={styles.pulseSection}>
          <View style={styles.ringContainer}>
            <HealthRing score={healthScore} size={160} />
          </View>
          <View style={styles.pulseMessage}>
            {issues.length === 0 ? (
              <View style={styles.statusBadgeSuccess}>
                <MaterialCommunityIcons name="check-circle" size={16} color="white" />
                <Text style={styles.statusText}>Evinizin durumu harika!</Text>
              </View>
            ) : (
              <View style={styles.statusBadgeDanger}>
                <MaterialCommunityIcons name="alert-circle" size={16} color="white" />
                <Text style={styles.statusText}>{issues[0]}</Text>
              </View>
            )}
          </View>
        </View>

        {/* --- 3. DRAWERS (Categories) --- */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Çekmeceler</Text>
        </View>
        <DrawerGrid stats={stats} />

        {/* --- 4. SMART INSIGHTS WIDGET --- */}
        <View style={styles.widgetContainer}>
          <LinearGradient
            colors={insight.color ? [insight.color + '10', insight.color + '05'] : ['#ffffff', '#f8fafc']}
            style={[styles.widgetCard, insight.color && { borderColor: insight.color + '30' }]}
          >
            <View style={[styles.widgetIcon, insight.color && { backgroundColor: insight.color + '20' }]}>
              <MaterialCommunityIcons
                name={insight.icon}
                size={24}
                color={insight.color || "#f59e0b"}
              />
            </View>
            <View style={styles.widgetContent}>
              <Text style={[styles.widgetTitle, insight.color && { color: insight.color }]}>
                {insight.title}
              </Text>
              <Text style={styles.widgetText}>
                {insight.text}
              </Text>
            </View>
          </LinearGradient>
        </View>

      </ScrollView>

      {/* FAB */}
      <FAB
        icon="plus"
        color="white"
        style={styles.fab}
        onPress={() => router.push('/add-record')}
      />


    </View>
  );
}

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  headerBackground: {
    paddingBottom: 10, // Reduced from 20
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    elevation: 4,
    zIndex: 1, // Reduced zIndex so content can be above if needed, but usually we want header background behind
  },
  headerSafeArea: {
    // safe area padding
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 4, // Reduced from 8
  },
  avatar: {
    width: 36, // Slightly smaller
    height: 36,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.5)'
  },
  headerContent: {
    paddingHorizontal: 24,
    paddingBottom: 8, // Reduced from 16
  },
  greetingText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
    fontWeight: '500',
  },
  homeTitle: {
    fontSize: 24, // Slightly smaller
    color: 'white',
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  contentContainer: {
    flex: 1,
    marginTop: 10, // Removed overlap, moved down for clarity
    zIndex: 10,
    overflow: 'visible',
  },
  pulseSection: {
    alignItems: 'center',
    marginBottom: 24,
    zIndex: 20,
    elevation: 20, // High elevation for Android to float over Header
  },
  ringContainer: {
    backgroundColor: 'white',
    borderRadius: 100,
    padding: 10,
    elevation: 25, // Even higher to be on top of pulseSection
    shadowColor: '#F57C00',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
  },
  pulseMessage: {
    marginTop: 16,
  },
  statusBadgeSuccess: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#22c55e',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  statusBadgeDanger: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ef4444',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  statusText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 14,
  },
  sectionHeader: {
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.textDark,
  },
  widgetContainer: {
    paddingHorizontal: 16,
    marginTop: 24,
    marginBottom: 24,
  },
  widgetCard: {
    flexDirection: 'row',
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  widgetIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#fffbeb',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  widgetContent: {
    flex: 1,
  },
  widgetTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#d97706',
    marginBottom: 4,
  },
  widgetText: {
    fontSize: 13,
    color: COLORS.textGray,
    lineHeight: 18,
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
