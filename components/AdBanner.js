import React, { useState } from 'react';
import { View, StyleSheet, Text } from 'react-native';
import { BannerAd, BannerAdSize, TestIds } from 'react-native-google-mobile-ads';

// Use Test ID for development to prevent bans
const adUnitId = __DEV__ ? TestIds.BANNER : 'ca-app-pub-xxxxxxxxxxxxxxxx/yyyyyyyyyy';

export default function AdBanner() {
    const [error, setError] = useState(false);

    if (error) {
        // If ad fails to load, collapse or show nothing
        return null;
    }

    return (
        <View style={styles.container}>
            <View style={styles.adLabelContainer}>
                <Text style={styles.adLabel}>Reklam</Text>
            </View>
            <BannerAd
                unitId={adUnitId}
                size={BannerAdSize.ANCHORED_ADAPTIVE_BANNER}
                requestOptions={{
                    requestNonPersonalizedAdsOnly: true,
                }}
                onAdFailedToLoad={(e) => {
                    console.log('Ad failed to load', e);
                    setError(true);
                }}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#f8fafc',
        paddingVertical: 10,
        borderTopWidth: 1,
        borderTopColor: '#e2e8f0',
    },
    adLabelContainer: {
        position: 'absolute',
        top: -10,
        right: 10,
        backgroundColor: '#f1f5f9',
        paddingHorizontal: 4,
        borderRadius: 4
    },
    adLabel: {
        fontSize: 8,
        color: '#cbd5e1'
    }
});
