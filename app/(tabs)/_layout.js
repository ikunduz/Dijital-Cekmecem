import React from 'react';
import { Tabs } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useHomeContext } from '../../context/HomeContext';
import { THEME_COLOR_MAP } from '../../utils/theme';

export default function TabLayout() {
    const { homeProfile } = useHomeContext();
    const themeColor = THEME_COLOR_MAP[homeProfile?.themeColor] || THEME_COLOR_MAP.orange;

    return (
        <Tabs
            screenOptions={{
                tabBarActiveTintColor: themeColor,
                tabBarInactiveTintColor: '#64748b',
                tabBarStyle: {
                    backgroundColor: '#ffffff',
                    borderTopWidth: 1,
                    borderTopColor: '#f1f5f9',
                    height: 60,
                    paddingBottom: 8,
                    paddingTop: 8,
                },
                headerShown: false,
                tabBarLabelStyle: {
                    fontSize: 12,
                    fontWeight: '500',
                },
            }}
        >
            <Tabs.Screen
                name="index"
                options={{
                    title: 'Evim',
                    tabBarIcon: ({ color, size }) => (
                        <MaterialCommunityIcons name="home-variant" size={size} color={color} />
                    ),
                }}
            />
            <Tabs.Screen
                name="wallet"
                options={{
                    title: 'Cüzdan',
                    tabBarIcon: ({ color, size }) => (
                        <MaterialCommunityIcons name="wallet" size={size} color={color} />
                    ),
                }}
            />
            <Tabs.Screen
                name="archive"
                options={{
                    href: null, // Hide from tab bar
                }}
            />
            <Tabs.Screen
                name="settings"
                options={{
                    title: 'Ayarlar',
                    tabBarIcon: ({ color, size }) => (
                        <MaterialCommunityIcons name="cog" size={size} color={color} />
                    ),
                }}
            />
        </Tabs>
    );
}
