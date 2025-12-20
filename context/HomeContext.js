import React, { createContext, useState, useEffect, useContext, useMemo } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const HomeContext = createContext();

export const useHomeContext = () => useContext(HomeContext);

export const HomeProvider = ({ children }) => {
    // --- STATE ---
    const [homes, setHomes] = useState([]);
    const [currentHomeId, setCurrentHomeId] = useState(null);
    const [allHistory, setAllHistory] = useState([]);
    const [xp, setXp] = useState(0);
    const [loading, setLoading] = useState(true);

    // --- DERIVED STATE ---
    const homeProfile = useMemo(() => {
        return homes.find(h => h.id === currentHomeId) || null;
    }, [homes, currentHomeId]);

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
            const homesJson = await AsyncStorage.getItem('@home_homes');
            let loadedHomes = homesJson ? JSON.parse(homesJson) : [];

            const historyJson = await AsyncStorage.getItem('@home_history');
            let loadedHistory = historyJson ? JSON.parse(historyJson) : [];

            const xpJson = await AsyncStorage.getItem('@home_xp');
            setXp(xpJson ? JSON.parse(xpJson) : 0);

            // AUTO-CREATE DEFAULT HOME
            if (loadedHomes.length === 0) {
                const defaultHome = {
                    id: Date.now(),
                    title: 'Evim',
                    address: '',
                    ownerName: '',
                    homeImage: null,
                    themeColor: 'orange',
                };
                loadedHomes = [defaultHome];
                await saveHomes(loadedHomes);
            }

            setHomes(loadedHomes);
            setAllHistory(loadedHistory);

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

    const saveXp = async (newXp) => {
        try {
            await AsyncStorage.setItem('@home_xp', JSON.stringify(newXp));
        } catch (e) {
            console.error("Failed to save XP", e);
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
        const newHomes = homes.filter(h => h.id !== homeId);
        setHomes(newHomes);
        await saveHomes(newHomes);

        const newHistory = allHistory.filter(h => h.homeId !== homeId);
        setAllHistory(newHistory);
        await saveHistory(newHistory);

        if (currentHomeId === homeId && newHomes.length > 0) {
            setCurrentHomeId(newHomes[0].id);
            await saveSelectedHomeId(newHomes[0].id);
        } else if (newHomes.length === 0) {
            setCurrentHomeId(null);
            await AsyncStorage.removeItem('@home_selected_id');
        }
    };

    // --- RECORD ACTIONS ---
    const addXP = async (amount) => {
        const newXp = xp + amount;
        setXp(newXp);
        await saveXp(newXp);
    };

    const addRecord = async (record) => {
        if (!currentHomeId) {
            console.error("No home selected, cannot add record");
            return;
        }
        const newRecord = { ...record, id: Date.now(), homeId: currentHomeId };
        const newHistory = [newRecord, ...allHistory];
        setAllHistory(newHistory);
        await saveHistory(newHistory);

        await addXP(10);
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
            homes,
            currentHomeId,
            history,
            homeProfile,
            addNewHome,
            updateHomeProfile,
            switchHome,
            deleteHome,
            addRecord,
            editRecord,
            deleteRecord,
            loading,
            xp,
            addXP
        }}>
            {children}
        </HomeContext.Provider>
    );
};
