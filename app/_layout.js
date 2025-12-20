import { Stack } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { HomeProvider } from '../context/HomeContext';
import { FinanceProvider } from '../context/FinanceContext';
import { PremiumProvider } from '../context/PremiumContext';

export default function Layout() {
  return (
    <PremiumProvider>
      <HomeProvider>
        <FinanceProvider>
          <GestureHandlerRootView style={{ flex: 1 }}>
            <Stack screenOptions={{ headerShown: false }}>
              <Stack.Screen name="(tabs)" />
              <Stack.Screen name="history" />
              <Stack.Screen name="bill-history" />
              <Stack.Screen name="official-docs" />
              <Stack.Screen name="folder-detail" />
              <Stack.Screen name="add-record" />
              <Stack.Screen name="add-transaction" />
              <Stack.Screen name="select-home" />
              <Stack.Screen name="add-home" />
              <Stack.Screen name="savings" />
            </Stack>
          </GestureHandlerRootView>
        </FinanceProvider>
      </HomeProvider>
    </PremiumProvider>
  );
}
