import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions } from 'react-native';
import { Surface, IconButton } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';

// --- COLORS (Improved Palette) ---
const COLORS = {
  primary: "#1d72d3",
  background: "#E5E7EB",  // Slightly darker gray
  textDark: "#111417",
  textGray: "#647487",
  white: "#FFFFFF",
  // Category Colors
  fuel: "#3b82f6",      // Blue
  service: "#f97316",   // Orange  
  documents: "#22c55e", // Green
};

const SCREEN_WIDTH = Dimensions.get('window').width;

export default function Kayitlarim({ navigation }) {
  const router = useRouter();

  // --- CATEGORY CARDS ---
  const categories = [
    {
      title: "Yakıt Kayıtları",
      subtitle: "Tüm yakıt alımları",
      icon: "gas-station",
      color: COLORS.fuel,
      route: '/fuel-history'
    },
    {
      title: "Servis / Bakım",
      subtitle: "Bakım ve onarım işlemleri",
      icon: "wrench",
      color: COLORS.service,
      route: '/history'
    },
    {
      title: "Resmi Belgeler",
      subtitle: "Sigorta, kasko, ruhsat...",
      icon: "file-document",
      color: COLORS.documents,
      route: '/official-docs'
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
          Tüm kayıtlarına buradan ulaşabilirsin
        </Text>

        {/* CATEGORY CARDS */}
        <View style={styles.cardsContainer}>
          {categories.map((category, index) => (
            <TouchableOpacity
              key={index}
              style={styles.cardWrapper}
              onPress={() => router.push(category.route)}
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
  // HEADER
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

  // INTRO
  introText: {
    fontSize: 15,
    color: COLORS.textGray,
    marginBottom: 24,
    textAlign: 'center',
  },

  // CARDS
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
