import React, { createContext, useState, useEffect, useContext, useMemo } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const HomeContext = createContext();

export const useHomeContext = () => useContext(HomeContext);

export const HomeProvider = ({ children }) => {
    // --- STATE ---
    const [homes, setHomes] = useState([]); // Array of home profiles
    const [currentHomeId, setCurrentHomeId] = useState(null); // ID of selected home
    const [allHistory, setAllHistory] = useState([]); // All records across all homes
    const [loading, setLoading] = useState(true);

    // --- DERIVED STATE ---
    // Current home profile
    const homeProfile = useMemo(() => {
        return homes.find(h => h.id === currentHomeId) || null;
    }, [homes, currentHomeId]);

    // History filtered by current home
    const history = useMemo(() => {
        if (!currentHomeId) return [];
        return allHistory.filter(h => h.homeId === currentHomeId);
    }, [allHistory, currentHomeId]);

    // --- LOAD DATA ---
    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            // Load homes array
            const homesJson = await AsyncStorage.getItem('@home_homes');
            let loadedHomes = homesJson ? JSON.parse(homesJson) : [];

            // Load history
            const historyJson = await AsyncStorage.getItem('@home_history');
            let loadedHistory = historyJson ? JSON.parse(historyJson) : [];

            // AUTO-CREATE DEFAULT HOME if none exist
            if (loadedHomes.length === 0) {
                const defaultHome = {
                    id: Date.now(),
                    title: 'Evim',
                    address: '',
                    ownerName: '',
                    daskNumber: '',
                    internetNumber: '',
                    homeImage: null,
                    themeColor: 'orange',
                };
                loadedHomes = [defaultHome];
                await AsyncStorage.setItem('@home_homes', JSON.stringify(loadedHomes));
            }

            setHomes(loadedHomes);
            setAllHistory(loadedHistory);

            // Load selected home ID (or default to first home)
            const selectedIdJson = await AsyncStorage.getItem('@home_selected_id');
            if (selectedIdJson) {
                setCurrentHomeId(JSON.parse(selectedIdJson));
            } else if (loadedHomes.length > 0) {
                setCurrentHomeId(loadedHomes[0].id);
                await AsyncStorage.setItem('@home_selected_id', JSON.stringify(loadedHomes[0].id));
            }

        } catch (e) {
            console.error("Failed to load data", e);
        } finally {
            setLoading(false);
        }
    };

    // --- SAVE HELPERS ---
    const saveHomes = async (newHomes) => {
        try {
            await AsyncStorage.setItem('@home_homes', JSON.stringify(newHomes));
        } catch (e) {
            console.error("Failed to save homes", e);
        }
    };

    const saveHistory = async (newHistory) => {
        try {
            await AsyncStorage.setItem('@home_history', JSON.stringify(newHistory));
        } catch (e) {
            console.error("Failed to save history", e);
        }
    };

    const saveSelectedHomeId = async (homeId) => {
        try {
            await AsyncStorage.setItem('@home_selected_id', JSON.stringify(homeId));
        } catch (e) {
            console.error("Failed to save selected home ID", e);
        }
    };

    // --- HOME ACTIONS ---
    const addNewHome = async (homeData) => {
        const newHome = { ...homeData, id: Date.now() };
        const newHomes = [...homes, newHome];
        setHomes(newHomes);
        await saveHomes(newHomes);

        // Switch to the new home
        setCurrentHomeId(newHome.id);
        await saveSelectedHomeId(newHome.id);
        return newHome;
    };

    const updateHomeProfile = async (updatedData) => {
        if (!currentHomeId) return;

        const newHomes = homes.map(home =>
            home.id === currentHomeId ? { ...home, ...updatedData } : home
        );
        setHomes(newHomes);
        await saveHomes(newHomes);
    };

    const switchHome = async (homeId) => {
        setCurrentHomeId(homeId);
        await saveSelectedHomeId(homeId);
    };

    const deleteHome = async (homeId) => {
        // Remove home from list
        const newHomes = homes.filter(h => h.id !== homeId);
        setHomes(newHomes);
        await saveHomes(newHomes);

        // Remove associated history
        const newHistory = allHistory.filter(h => h.homeId !== homeId);
        setAllHistory(newHistory);
        await saveHistory(newHistory);

        // If deleted home was current, switch to first available
        if (currentHomeId === homeId && newHomes.length > 0) {
            setCurrentHomeId(newHomes[0].id);
            await saveSelectedHomeId(newHomes[0].id);
        } else if (newHomes.length === 0) {
            setCurrentHomeId(null);
            await AsyncStorage.removeItem('@home_selected_id');
        }
    };

    // --- RECORD ACTIONS ---
    const addRecord = async (record) => {
        if (!currentHomeId) {
            console.error("No home selected, cannot add record");
            return;
        }
        const newRecord = { ...record, id: Date.now(), homeId: currentHomeId };
        const newHistory = [newRecord, ...allHistory];
        setAllHistory(newHistory);
        await saveHistory(newHistory);
    };

    const editRecord = async (id, updatedRecord) => {
        const newHistory = allHistory.map((item) =>
            item.id === id ? { ...updatedRecord, id, homeId: item.homeId } : item
        );
        setAllHistory(newHistory);
        await saveHistory(newHistory);
    };

    const deleteRecord = async (id) => {
        const newHistory = allHistory.filter((item) => item.id !== id);
        setAllHistory(newHistory);
        await saveHistory(newHistory);
    };

    return (
        <HomeContext.Provider value={{
            // Multi-home state
            homes,
            currentHomeId,
            // Backwards-compatible accessors (filtered by current home)
            history,
            homeProfile,
            // Home actions
            addNewHome,
            updateHomeProfile,
            switchHome,
            deleteHome,
            // Record actions
            addRecord,
            editRecord,
            deleteRecord,
            // Loading state
            loading
        }}>
            {children}
        </HomeContext.Provider>
    );
};
