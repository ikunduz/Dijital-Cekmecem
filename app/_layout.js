import { Drawer } from 'expo-router/drawer';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { DrawerContentScrollView } from '@react-navigation/drawer';
import { Divider, Icon as PaperIcon } from 'react-native-paper'; // Renamed import to avoid conflict if I used it, but here I use MaterialIcons mostly
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, usePathname } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { CarProvider, useCarContext } from '../context/CarContext';

const COLORS = {
  primary: "#1d72d3",
  white: "#FFFFFF",
  textGray: "#647487",
  background: "#f8f9fa",
};

// Theme color mapping
const THEME_COLOR_MAP = {
  blue: '#1d72d3',
  teal: '#0d9488',
  orange: '#ea580c',
  slate: '#475569',
};

// 1. Define MenuRow Component
const MenuRow = ({ title, icon, onPress }) => (
  <TouchableOpacity onPress={onPress} style={styles.menuRow}>
    <MaterialIcons name={icon} size={24} color="#555" style={{ marginRight: 16 }} />
    <Text style={styles.menuText}>{title}</Text>
  </TouchableOpacity>
);

function CustomDrawerContent(props) {
  const router = useRouter();

  /* REPLACE DEFAULT EXPORT WITH THIS TO USE CONTEXT */
  const { carProfile } = useCarContext();
  const userName = carProfile?.ownerName || "Misafir Kullanıcı";
  const themeColor = THEME_COLOR_MAP[carProfile?.themeColor] || THEME_COLOR_MAP.blue;

  return (
    <View style={{ flex: 1 }}>
      <DrawerContentScrollView {...props} contentContainerStyle={{ paddingTop: 0 }}>

        {/* CUSTOM HEADER SECTION (User Avatar) */}
        <View style={[styles.drawerHeader, { backgroundColor: themeColor }]}>
          <View style={styles.userInfo}>
            <Image
              source={{ uri: "https://lh3.googleusercontent.com/aida-public/AB6AXuChplR9slGNSD2n4I69k6u2GZx7v4whF9GR0bHFLh3j0Qk7k5ZPV5eOThiKmdlN6SbVIHmveWpp1NLsLCDfkVAQ95AsDoxarA6N3WN6I-XYT_H3acsKNTQc3S8IpJL4dmkOyGd2z_TlxsWHKRTChby68ptlqYMOtFv3vt9OgGKQtJ7c2Nj29pMVKjIJ_CGn-AZ0TntSLrtgpn_P2zXZBsJmyT_uwwL0jve0TIqD5_I0OIlsV9hPYCbwtrrygkU3lq7a8fx16W1-Yjs" }}
              style={styles.avatar}
            />
            <View style={{ marginLeft: 15 }}>
              <Text style={styles.welcomeText}>Hoşgeldin,</Text>
              <Text style={styles.userName}>{userName}</Text>
            </View>
          </View>
        </View>

        {/* MANUAL MENU ITEMS */}
        <View style={{ marginTop: 10 }}>
          <MenuRow
            title="Ana Sayfa"
            icon="home"
            onPress={() => router.push('/')}
          />
          <MenuRow
            title="Kayıtlarım"
            icon="folder-open"
            onPress={() => router.push('/documents')}
          />
        </View>

      </DrawerContentScrollView>

      {/* FOOTER SECTION */}
      <View style={styles.footer}>
        <Divider style={{ marginBottom: 15 }} />
        <TouchableOpacity onPress={() => router.push('/settings')} style={styles.menuRow}>
          <MaterialIcons name="settings" size={24} color="#555" style={{ marginRight: 16 }} />
          <Text style={styles.menuText}>Ayarlar</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => console.log('Çıkış yapıldı')} style={styles.menuRow}>
          <MaterialIcons name="logout" size={24} color="#555" style={{ marginRight: 16 }} />
          <Text style={styles.menuText}>Çıkış Yap</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

export default function Layout() {
  return (
    <CarProvider>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <Drawer
          drawerContent={(props) => <CustomDrawerContent {...props} />}
          backBehavior="history"
          screenOptions={{
            headerShown: false,
            drawerStyle: { width: '80%' },
          }}
        >
          <Drawer.Screen name="index" />
          <Drawer.Screen name="history" />
          <Drawer.Screen name="documents" />
          <Drawer.Screen name="add-record" />
          <Drawer.Screen name="folder-detail" />
          <Drawer.Screen name="official-docs" />
          <Drawer.Screen name="fuel-history" />
          <Drawer.Screen name="settings" />
        </Drawer>
      </GestureHandlerRootView>
    </CarProvider>
  );
}

const styles = StyleSheet.create({
  drawerHeader: {
    backgroundColor: COLORS.primary,
    padding: 20,
    paddingTop: 50,
    marginBottom: 10,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 2,
    borderColor: COLORS.white,
  },
  welcomeText: {
    color: '#e0e0e0',
    fontSize: 14,
  },
  userName: {
    color: COLORS.white,
    fontSize: 18,
    fontWeight: 'bold',
  },

  // Menu Row Styles
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    marginHorizontal: 12,
    marginVertical: 2,
    borderRadius: 12,
  },
  menuText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },

  // Footer
  footer: {
    paddingBottom: 30,
    paddingHorizontal: 0,
  },
});
