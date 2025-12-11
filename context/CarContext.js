import React, { createContext, useState, useEffect, useContext, useMemo } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const CarContext = createContext();

export const useCarContext = () => useContext(CarContext);

export const CarProvider = ({ children }) => {
    // --- STATE ---
    const [cars, setCars] = useState([]); // Array of car profiles
    const [currentCarId, setCurrentCarId] = useState(null); // ID of selected car
    const [allHistory, setAllHistory] = useState([]); // All records across all cars
    const [loading, setLoading] = useState(true);

    // --- DERIVED STATE ---
    // Current car profile (for backwards compatibility and convenience)
    const carProfile = useMemo(() => {
        return cars.find(c => c.id === currentCarId) || null;
    }, [cars, currentCarId]);

    // History filtered by current car
    const history = useMemo(() => {
        if (!currentCarId) return [];
        return allHistory.filter(h => h.carId === currentCarId);
    }, [allHistory, currentCarId]);

    // --- LOAD DATA ---
    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            // Load cars array
            const carsJson = await AsyncStorage.getItem('@car_cars');
            let loadedCars = carsJson ? JSON.parse(carsJson) : [];

            // Load history
            const historyJson = await AsyncStorage.getItem('@car_history');
            let loadedHistory = historyJson ? JSON.parse(historyJson) : [];

            // --- MIGRATION: Check for legacy single-car profile ---
            const legacyProfileJson = await AsyncStorage.getItem('@car_profile');
            if (legacyProfileJson && loadedCars.length === 0) {
                const legacyProfile = JSON.parse(legacyProfileJson);
                const migratedCar = { ...legacyProfile, id: Date.now() };
                loadedCars = [migratedCar];

                // Assign carId to all existing history records
                loadedHistory = loadedHistory.map(record => ({
                    ...record,
                    carId: record.carId || migratedCar.id
                }));

                // Save migrated data
                await AsyncStorage.setItem('@car_cars', JSON.stringify(loadedCars));
                await AsyncStorage.setItem('@car_history', JSON.stringify(loadedHistory));

                // Clear legacy key
                await AsyncStorage.removeItem('@car_profile');
            }

            setCars(loadedCars);
            setAllHistory(loadedHistory);

            // Load selected car ID (or default to first car)
            const selectedIdJson = await AsyncStorage.getItem('@car_selected_id');
            if (selectedIdJson) {
                setCurrentCarId(JSON.parse(selectedIdJson));
            } else if (loadedCars.length > 0) {
                setCurrentCarId(loadedCars[0].id);
            }

        } catch (e) {
            console.error("Failed to load data", e);
        } finally {
            setLoading(false);
        }
    };

    // --- SAVE HELPERS ---
    const saveCars = async (newCars) => {
        try {
            await AsyncStorage.setItem('@car_cars', JSON.stringify(newCars));
        } catch (e) {
            console.error("Failed to save cars", e);
        }
    };

    const saveHistory = async (newHistory) => {
        try {
            await AsyncStorage.setItem('@car_history', JSON.stringify(newHistory));
        } catch (e) {
            console.error("Failed to save history", e);
        }
    };

    const saveSelectedCarId = async (carId) => {
        try {
            await AsyncStorage.setItem('@car_selected_id', JSON.stringify(carId));
        } catch (e) {
            console.error("Failed to save selected car ID", e);
        }
    };

    // --- CAR ACTIONS ---
    const addNewCar = async (carData) => {
        const newCar = { ...carData, id: Date.now() };
        const newCars = [...cars, newCar];
        setCars(newCars);
        await saveCars(newCars);

        // Switch to the new car
        setCurrentCarId(newCar.id);
        await saveSelectedCarId(newCar.id);
        return newCar;
    };

    const updateCarProfile = async (updatedData) => {
        if (!currentCarId) return;

        const newCars = cars.map(car =>
            car.id === currentCarId ? { ...car, ...updatedData } : car
        );
        setCars(newCars);
        await saveCars(newCars);
    };

    const switchCar = async (carId) => {
        setCurrentCarId(carId);
        await saveSelectedCarId(carId);
    };

    const deleteCar = async (carId) => {
        // Remove car from list
        const newCars = cars.filter(c => c.id !== carId);
        setCars(newCars);
        await saveCars(newCars);

        // Remove associated history
        const newHistory = allHistory.filter(h => h.carId !== carId);
        setAllHistory(newHistory);
        await saveHistory(newHistory);

        // If deleted car was current, switch to first available
        if (currentCarId === carId && newCars.length > 0) {
            setCurrentCarId(newCars[0].id);
            await saveSelectedCarId(newCars[0].id);
        } else if (newCars.length === 0) {
            setCurrentCarId(null);
            await AsyncStorage.removeItem('@car_selected_id');
        }
    };

    // --- RECORD ACTIONS ---
    const addRecord = async (record) => {
        if (!currentCarId) {
            console.error("No car selected, cannot add record");
            return;
        }
        const newRecord = { ...record, id: Date.now(), carId: currentCarId };
        const newHistory = [newRecord, ...allHistory];
        setAllHistory(newHistory);
        await saveHistory(newHistory);
    };

    const editRecord = async (id, updatedRecord) => {
        const newHistory = allHistory.map((item) =>
            item.id === id ? { ...updatedRecord, id, carId: item.carId } : item
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
        <CarContext.Provider value={{
            // Multi-car state
            cars,
            currentCarId,
            // Backwards-compatible accessors (filtered by current car)
            history,
            carProfile,
            // Car actions
            addNewCar,
            updateCarProfile,
            switchCar,
            deleteCar,
            // Record actions
            addRecord,
            editRecord,
            deleteRecord,
            // Loading state
            loading
        }}>
            {children}
        </CarContext.Provider>
    );
};
