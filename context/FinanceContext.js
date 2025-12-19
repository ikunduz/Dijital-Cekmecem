import React, { createContext, useState, useEffect, useContext, useMemo } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useHomeContext } from './HomeContext';

const FinanceContext = createContext();

export const useFinanceContext = () => useContext(FinanceContext);

// Kategori tanımları
export const INCOME_CATEGORIES = [
    { id: 'salary', label: 'Maaş', icon: 'briefcase', color: '#22c55e' },
    { id: 'rent', label: 'Kira Geliri', icon: 'home', color: '#3b82f6' },
    { id: 'allowance', label: 'Harçlık', icon: 'gift', color: '#a855f7' },
    { id: 'investment', label: 'Yatırım', icon: 'trending-up', color: '#f59e0b' },
    { id: 'other_income', label: 'Diğer', icon: 'plus-circle', color: '#6b7280' },
];

export const EXPENSE_CATEGORIES = [
    { id: 'market', label: 'Market', icon: 'cart', color: '#ef4444' },
    { id: 'food', label: 'Yeme-İçme', icon: 'coffee', color: '#f97316' },
    { id: 'entertainment', label: 'Eğlence', icon: 'movie', color: '#ec4899' },
    { id: 'transport', label: 'Ulaşım', icon: 'car', color: '#8b5cf6' },
    { id: 'clothing', label: 'Giyim', icon: 'shopping', color: '#06b6d4' },
    { id: 'health', label: 'Sağlık', icon: 'heart', color: '#10b981' },
    { id: 'education', label: 'Eğitim', icon: 'book', color: '#3b82f6' },
    { id: 'other_expense', label: 'Diğer', icon: 'dots-horizontal', color: '#6b7280' },
];

export const FinanceProvider = ({ children }) => {
    // --- STATE ---
    const [transactions, setTransactions] = useState([]);
    const [savingsGoals, setSavingsGoals] = useState([]);
    const [loading, setLoading] = useState(true);
    const { addXP } = useHomeContext();

    // --- LOAD DATA ---
    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const transJson = await AsyncStorage.getItem('@finance_transactions');
            const savingsJson = await AsyncStorage.getItem('@finance_savings');

            setTransactions(transJson ? JSON.parse(transJson) : []);
            setSavingsGoals(savingsJson ? JSON.parse(savingsJson) : []);
        } catch (e) {
            console.error("Failed to load finance data", e);
        } finally {
            setLoading(false);
        }
    };

    // --- SAVE HELPERS ---
    const saveTransactions = async (newTrans) => {
        try {
            await AsyncStorage.setItem('@finance_transactions', JSON.stringify(newTrans));
        } catch (e) {
            console.error("Failed to save transactions", e);
        }
    };

    const saveSavingsGoals = async (newGoals) => {
        try {
            await AsyncStorage.setItem('@finance_savings', JSON.stringify(newGoals));
        } catch (e) {
            console.error("Failed to save savings goals", e);
        }
    };

    // --- TRANSACTION ACTIONS ---
    const addTransaction = async (transaction, homeId) => {
        const newTransaction = {
            ...transaction,
            id: Date.now(),
            homeId: homeId,
            createdAt: new Date().toISOString(),
        };
        const newTransactions = [newTransaction, ...transactions];
        setTransactions(newTransactions);
        await saveTransactions(newTransactions);

        // Add XP for transaction
        if (addXP) await addXP(10);

        return newTransaction;
    };

    const editTransaction = async (id, updatedData) => {
        const newTransactions = transactions.map(t =>
            t.id === id ? { ...t, ...updatedData } : t
        );
        setTransactions(newTransactions);
        await saveTransactions(newTransactions);
    };

    const deleteTransaction = async (id) => {
        const newTransactions = transactions.filter(t => t.id !== id);
        setTransactions(newTransactions);
        await saveTransactions(newTransactions);
    };

    // --- SAVINGS GOAL ACTIONS ---
    const addSavingsGoal = async (goal) => {
        const newGoal = {
            ...goal,
            id: Date.now(),
            currentAmount: 0,
            createdAt: new Date().toISOString(),
        };
        const newGoals = [...savingsGoals, newGoal];
        setSavingsGoals(newGoals);
        await saveSavingsGoals(newGoals);

        // Add XP for new goal
        if (addXP) await addXP(20);

        return newGoal;
    };

    const updateSavingsGoal = async (id, updatedData) => {
        const newGoals = savingsGoals.map(g =>
            g.id === id ? { ...g, ...updatedData } : g
        );
        setSavingsGoals(newGoals);
        await saveSavingsGoals(newGoals);
    };

    const deleteSavingsGoal = async (id) => {
        const newGoals = savingsGoals.filter(g => g.id !== id);
        setSavingsGoals(newGoals);
        await saveSavingsGoals(newGoals);
    };

    // --- COMPUTED VALUES ---
    const getMonthlyStats = React.useCallback((homeId, month = new Date().getMonth(), year = new Date().getFullYear()) => {
        const filtered = transactions.filter(t => {
            if (homeId && String(t.homeId) !== String(homeId)) return false;
            const parts = t.date.split('.');
            if (parts.length < 3) return false;
            const tDate = new Date(parts[2], parts[1] - 1, parts[0]);
            return tDate.getMonth() === month && tDate.getFullYear() === year;
        });

        const income = filtered
            .filter(t => t.type === 'income')
            .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);

        const expense = filtered
            .filter(t => t.type === 'expense')
            .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);

        return {
            income,
            expense,
            balance: income - expense,
            transactionCount: filtered.length,
        };
    }, [transactions]);

    const getCategoryBreakdown = React.useCallback((homeId, type = 'expense', month = new Date().getMonth(), year = new Date().getFullYear()) => {
        const filtered = transactions.filter(t => {
            if (homeId && String(t.homeId) !== String(homeId)) return false;
            if (t.type !== type) return false;
            const parts = t.date.split('.');
            if (parts.length < 3) return false;
            const tDate = new Date(parts[2], parts[1] - 1, parts[0]);
            return tDate.getMonth() === month && tDate.getFullYear() === year;
        });

        const breakdown = {};
        filtered.forEach(t => {
            if (!breakdown[t.category]) {
                breakdown[t.category] = 0;
            }
            breakdown[t.category] += (Number(t.amount) || 0);
        });

        return breakdown;
    }, [transactions]);

    const getRecentTransactions = React.useCallback((homeId, limit = 10) => {
        return transactions
            .filter(t => !homeId || String(t.homeId) === String(homeId))
            .slice(0, limit);
    }, [transactions]);

    const getMonthlyTrend = React.useCallback((homeId, months = 6) => {
        const trend = [];
        const now = new Date();

        for (let i = months - 1; i >= 0; i--) {
            const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const stats = getMonthlyStats(homeId, date.getMonth(), date.getFullYear());
            trend.push({
                month: date.toLocaleDateString('tr-TR', { month: 'short' }),
                year: date.getFullYear(),
                ...stats,
            });
        }

        return trend;
    }, [getMonthlyStats]);

    return (
        <FinanceContext.Provider value={{
            // State
            transactions,
            savingsGoals,
            loading,
            // Categories
            INCOME_CATEGORIES,
            EXPENSE_CATEGORIES,
            // Transaction actions
            addTransaction,
            editTransaction,
            deleteTransaction,
            // Savings actions
            addSavingsGoal,
            updateSavingsGoal,
            deleteSavingsGoal,
            // Computed
            getMonthlyStats,
            getCategoryBreakdown,
            getRecentTransactions,
            getMonthlyTrend,
        }}>
            {children}
        </FinanceContext.Provider>
    );
};
