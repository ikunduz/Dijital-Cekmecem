import React, { createContext, useState, useEffect, useContext } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const CarContext = createContext();

export const useCarContext = () => useContext(CarContext);

export const CarProvider = ({ children }) => {
    const [history, setHistory] = useState([]);
    const [carProfile, setCarProfile] = useState(null); // { ownerName, make, model, plate, year }
    const [loading, setLoading] = useState(true);

    // Load data on mount
    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const historyJson = await AsyncStorage.getItem('@car_history');
            if (historyJson != null) {
                setHistory(JSON.parse(historyJson));
            }

            const profileJson = await AsyncStorage.getItem('@car_profile');
            if (profileJson != null) {
                setCarProfile(JSON.parse(profileJson));
            }
        } catch (e) {
            console.error("Failed to load data", e);
        } finally {
            setLoading(false);
        }
    };

    const saveHistory = async (newHistory) => {
        try {
            const jsonValue = JSON.stringify(newHistory);
            await AsyncStorage.setItem('@car_history', jsonValue);
        } catch (e) {
            console.error("Failed to save history", e);
        }
    };

    const updateCarProfile = async (newProfile) => {
        try {
            // Merge with existing profile to preserve carImage if not provided
            const mergedProfile = { ...carProfile, ...newProfile };
            setCarProfile(mergedProfile);
            const jsonValue = JSON.stringify(mergedProfile);
            await AsyncStorage.setItem('@car_profile', jsonValue);
        } catch (e) {
            console.error("Failed to save profile", e);
        }
    };

    const addRecord = async (record) => {
        const newRecord = { ...record, id: Date.now() };
        const newHistory = [newRecord, ...history];
        setHistory(newHistory);
        await saveHistory(newHistory);
    };

    const editRecord = async (id, updatedRecord) => {
        // Keep the original ID, overwrite other fields
        const newHistory = history.map((item) =>
            item.id === id ? { ...updatedRecord, id } : item
        );
        setHistory(newHistory);
        await saveHistory(newHistory);
    };

    const deleteRecord = async (id) => {
        const newHistory = history.filter((item) => item.id !== id);
        setHistory(newHistory);
        await saveHistory(newHistory);
    };

    return (
        <CarContext.Provider value={{
            history,
            carProfile,
            addRecord,
            deleteRecord,
            editRecord,
            updateCarProfile,
            loading
        }}>
            {children}
        </CarContext.Provider>
    );
};
