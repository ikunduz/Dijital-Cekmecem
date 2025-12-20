import React, { createContext, useState, useEffect, useContext } from 'react';
import { Platform, Alert } from 'react-native';
import Constants from 'expo-constants';

// Check if we're running in Expo Go
const isExpoGo = Constants.appOwnership === 'expo';

// Only import Purchases if not in Expo Go
let Purchases;
if (!isExpoGo) {
    try {
        Purchases = require('react-native-purchases').default;
    } catch (e) {
        console.log('Purchases module not available:', e.message);
    }
}

// RevenueCat API Keys
const REVENUECAT_API_KEY = 'goog_cvaipGVlmxwCFjoUwnKFRsTLdjd';

// Offering and Entitlement IDs
const OFFERING_ID = 'Standard';
const ENTITLEMENT_ID = 'premium';

const PremiumContext = createContext();

export const usePremium = () => useContext(PremiumContext);

export const PremiumProvider = ({ children }) => {
    const [isPremium, setIsPremium] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        initializePurchases();
    }, []);

    const initializePurchases = async () => {
        if (isExpoGo || !Purchases) {
            setLoading(false);
            return;
        }

        try {
            // Configure Purchases with debug logs in DEV
            Purchases.setLogLevel(__DEV__ ? Purchases.LOG_LEVEL.DEBUG : Purchases.LOG_LEVEL.INFO);

            await Purchases.configure({
                apiKey: REVENUECAT_API_KEY,
            });

            // Check current customer info
            await checkPremiumStatus();
        } catch (error) {
            console.error('Failed to initialize Purchases:', error);
        } finally {
            setLoading(false);
        }
    };

    const checkPremiumStatus = async () => {
        if (isExpoGo || !Purchases) return;

        try {
            const customerInfo = await Purchases.getCustomerInfo();
            const hasPremium = customerInfo.entitlements.active[ENTITLEMENT_ID] !== undefined;
            setIsPremium(hasPremium);
        } catch (error) {
            console.error('Failed to check premium status:', error);
        }
    };

    const purchaseRemoveAds = async () => {
        if (isExpoGo || !Purchases) {
            Alert.alert('Bilgi', 'Satın alma işlemi sadece build edilmiş uygulamada çalışır.');
            return false;
        }

        try {
            // Get offerings
            const offerings = await Purchases.getOfferings();

            if (!offerings.all[OFFERING_ID]) {
                Alert.alert('Hata', 'Teklif bulunamadı. Lütfen daha sonra tekrar deneyin.');
                return false;
            }

            const offering = offerings.all[OFFERING_ID];

            if (!offering.availablePackages || offering.availablePackages.length === 0) {
                Alert.alert('Hata', 'Paket bulunamadı. Lütfen daha sonra tekrar deneyin.');
                return false;
            }

            // Get the first available package (Reklamsiz)
            const packageToPurchase = offering.availablePackages[0];

            // Purchase the package
            const { customerInfo } = await Purchases.purchasePackage(packageToPurchase);

            // Check if premium is now active
            if (customerInfo.entitlements.active[ENTITLEMENT_ID] !== undefined) {
                setIsPremium(true);
                Alert.alert(
                    'Teşekkürler! 🎉',
                    'Satın alma işlemi başarılı! Artık reklamsız deneyimin keyfini çıkarabilirsin.',
                    [{ text: 'Harika!' }]
                );
                return true;
            }

            return false;
        } catch (error) {
            if (error.userCancelled) {
                // User cancelled, don't show error
                return false;
            }
            console.error('Purchase error:', error);
            Alert.alert('Hata', 'Satın alma işlemi başarısız oldu. Lütfen tekrar deneyin.');
            return false;
        }
    };

    const restorePurchases = async () => {
        if (isExpoGo || !Purchases) {
            Alert.alert('Bilgi', 'Geri yükleme işlemi sadece build edilmiş uygulamada çalışır.');
            return false;
        }

        try {
            const customerInfo = await Purchases.restorePurchases();
            const hasPremium = customerInfo.entitlements.active[ENTITLEMENT_ID] !== undefined;

            if (hasPremium) {
                setIsPremium(true);
                Alert.alert('Başarılı', 'Satın alımlarınız geri yüklendi!');
                return true;
            } else {
                Alert.alert('Bilgi', 'Geri yüklenecek satın alım bulunamadı.');
                return false;
            }
        } catch (error) {
            console.error('Restore error:', error);
            Alert.alert('Hata', 'Geri yükleme işlemi başarısız oldu.');
            return false;
        }
    };

    return (
        <PremiumContext.Provider value={{
            isPremium,
            loading,
            purchaseRemoveAds,
            restorePurchases,
            checkPremiumStatus,
        }}>
            {children}
        </PremiumContext.Provider>
    );
};
