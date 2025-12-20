import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import { usePremium } from '../context/PremiumContext';

// Check if we're running in Expo Go
const isExpoGo = Constants.appOwnership === 'expo';

// Only import ads module if not in Expo Go
let BannerAd, BannerAdSize, TestIds, InterstitialAd, AdEventType;
if (!isExpoGo) {
    try {
        const ads = require('react-native-google-mobile-ads');
        BannerAd = ads.BannerAd;
        BannerAdSize = ads.BannerAdSize;
        TestIds = ads.TestIds;
        InterstitialAd = ads.InterstitialAd;
        AdEventType = ads.AdEventType;
    } catch (e) {
        console.log('Ads module not available:', e.message);
    }
}

// Get AdMob IDs from app.json/extra (not hardcoded)
const expoConfig = Constants.expoConfig || Constants.manifest;
const adMobConfig = expoConfig?.extra?.adMob || {};

const AD_UNIT_IDS = {
    BANNER: __DEV__ ? (TestIds?.ADAPTIVE_BANNER || 'test') : (adMobConfig.bannerUnitId || 'test'),
    INTERSTITIAL: __DEV__ ? (TestIds?.INTERSTITIAL || 'test') : (adMobConfig.interstitialUnitId || 'test'),
};

// --- BANNER AD COMPONENT ---
export const BannerAdComponent = () => {
    const [adAvailable, setAdAvailable] = useState(true);

    // Get premium status - wrapped in try/catch for when context isn't available
    let isPremium = false;
    try {
        const premiumContext = usePremium();
        isPremium = premiumContext?.isPremium || false;
    } catch (e) {
        // Context not available, show ads
    }

    // Don't render ads if premium or in Expo Go
    if (isPremium || isExpoGo || !BannerAd) {
        return null;
    }

    if (!adAvailable) return null;

    return (
        <View style={styles.bannerContainer}>
            <BannerAd
                unitId={AD_UNIT_IDS.BANNER}
                size={BannerAdSize.ANCHORED_ADAPTIVE_BANNER}
                requestOptions={{
                    requestNonPersonalizedAdsOnly: true,
                }}
                onAdFailedToLoad={() => setAdAvailable(false)}
            />
        </View>
    );
};

// --- INTERSTITIAL AD LOGIC ---
let interstitial = null;
let isPremiumGlobal = false;

// Function to update premium status for interstitial
export const setInterstitialPremiumStatus = (isPremium) => {
    isPremiumGlobal = isPremium;
};

if (!isExpoGo && InterstitialAd) {
    try {
        interstitial = InterstitialAd.createForAdRequest(AD_UNIT_IDS.INTERSTITIAL, {
            requestNonPersonalizedAdsOnly: true,
        });
    } catch (e) {
        console.log('Ads not available:', e.message);
    }
}

export const showInterstitialIfQualified = async (isPremium = false) => {
    // Skip ads if premium or in Expo Go
    if (isPremium || isPremiumGlobal || isExpoGo || !interstitial) return;

    try {
        const countStr = await AsyncStorage.getItem('@ad_record_count');
        let count = countStr ? parseInt(countStr) : 0;
        count += 1;

        await AsyncStorage.setItem('@ad_record_count', count.toString());

        if (count >= 3) {
            await AsyncStorage.setItem('@ad_record_count', '0');
            if (interstitial.loaded) {
                interstitial.show();
            } else {
                interstitial.load();
            }
        } else {
            if (!interstitial.loaded) {
                interstitial.load();
            }
        }
    } catch (e) {
        console.error('Interstitial error', e);
    }
};

// Initialize interstitial ad listener
if (!isExpoGo && interstitial && AdEventType) {
    try {
        interstitial.addAdEventListener(AdEventType.CLOSED, () => {
            interstitial.load();
        });
        interstitial.load();
    } catch (e) {
        console.log('Failed to initialize interstitial:', e.message);
    }
}

const styles = StyleSheet.create({
    bannerContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 10,
        backgroundColor: 'transparent',
    },
});
