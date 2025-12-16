import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions } from 'react-native';
import { Surface, IconButton } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';

// --- COLORS (Home Theme) ---
const COLORS = {
  primary: "#F57C00",
  background: "#E5E7EB",
  textDark: "#111417",
  textGray: "#647487",
  white: "#FFFFFF",
  // Category Colors
  bill: "#3b82f6",      // Blue
  warranty: "#8b5cf6",   // Purple
  documents: "#22c55e", // Green
};

export default function Documents({ navigation }) {
  const router = useRouter();

  // --- CATEGORY CARDS ---
  const categories = [
    {
      title: "Faturalar",
      subtitle: "Elektrik, Su, Doğalgaz...",
      icon: "receipt",
      color: COLORS.bill,
      route: '/bill-history'
    },
    {
      title: "Garantiler",
      subtitle: "Eşya ve ürün garantileri",
      icon: "shield-check",
      color: COLORS.warranty,
      // Pass params for folder-detail
      route: '/folder-detail?category=Garantiler'
    },
    {
      title: "Resmi Evraklar",
      subtitle: "Tapu, Kira, DASK...",
      icon: "file-document",
      color: COLORS.documents,
      route: '/folder-detail?category=Resmi Evraklar'
    },
  ];

  const handleOpenDrawer = () => {
    navigation?.openDrawer();
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>

      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.menuButton} onPress={handleOpenDrawer}>
          <IconButton icon="menu" size={24} iconColor={COLORS.textDark} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Kayıtlarım</Text>
        <TouchableOpacity style={styles.menuButton} onPress={() => router.push('/')}>
          <MaterialCommunityIcons name="home-outline" size={28} color={COLORS.textDark} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

        {/* INTRO TEXT */}
        <Text style={styles.introText}>
          Tüm evrak ve kayıtlarına buradan ulaşabilirsin
        </Text>

        {/* CATEGORY CARDS */}
        <View style={styles.cardsContainer}>
          {categories.map((category, index) => (
            <TouchableOpacity
              key={index}
              style={styles.cardWrapper}
              onPress={() => {
                if (category.route.includes('?')) {
                  const [pathname, query] = category.route.split('?');
                  const params = Object.fromEntries(new URLSearchParams(query));
                  router.push({ pathname, params });
                } else {
                  router.push(category.route);
                }
              }}
              activeOpacity={0.7}
            >
              <Surface style={styles.card} elevation={3}>
                {/* Icon Circle */}
                <View style={[styles.iconCircle, { backgroundColor: `${category.color}15` }]}>
                  <MaterialCommunityIcons
                    name={category.icon}
                    size={36}
                    color={category.color}
                  />
                </View>

                {/* Text Content */}
                <Text style={styles.cardTitle}>{category.title}</Text>
                <Text style={styles.cardSubtitle}>{category.subtitle}</Text>

                {/* Arrow Indicator */}
                <View style={[styles.arrowCircle, { backgroundColor: category.color }]}>
                  <MaterialCommunityIcons name="chevron-right" size={20} color={COLORS.white} />
                </View>
              </Surface>
            </TouchableOpacity>
          ))}
        </View>

        {/* BOTTOM SPACER */}
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    paddingVertical: 8,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  menuButton: {
    width: 48,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.textDark,
  },
  scrollContent: {
    padding: 20,
  },
  introText: {
    fontSize: 15,
    color: COLORS.textGray,
    marginBottom: 24,
    textAlign: 'center',
  },
  cardsContainer: {
    gap: 16,
  },
  cardWrapper: {
    width: '100%',
  },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 20,
    position: 'relative',
    overflow: 'hidden',
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.textDark,
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: 14,
    color: COLORS.textGray,
  },
  arrowCircle: {
    position: 'absolute',
    top: 20,
    right: 20,
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
