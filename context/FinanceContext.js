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
    { id: 'bill', label: 'Fatura', icon: 'receipt', color: '#f59e0b' },
    { id: 'aidat', label: 'Aidat', icon: 'home-city', color: '#6366f1' },
    { id: 'rent', label: 'Kira/Kredi', icon: 'home-key', color: '#8b5cf6' },
    { id: 'allowance', label: 'Harçlık', icon: 'account-child', color: '#ec4899' },
    { id: 'market', label: 'Market/Mutfak', icon: 'cart', color: '#ef4444' },
    { id: 'food', label: 'Dışarıda Yemek', icon: 'coffee', color: '#f97316' },
    { id: 'transport', label: 'Ulaşım', icon: 'car', color: '#3b82f6' },
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
        const timestamp = Date.now();
        const mainTransaction = {
            ...transaction,
            id: timestamp,
            homeId: homeId,
            status: transaction.status || 'completed',
            createdAt: new Date().toISOString(),
        };

        let updatedTransactions = [mainTransaction, ...transactions];

        // Handle Recurring: Auto-create next month's entry as pending
        if (transaction.isRecurring) {
            const parts = transaction.date.split('.');
            let d = new Date(parts[2], parts[1] - 1, parts[0]);
            d.setMonth(d.getMonth() + 1);

            const nextMonthDate = `${d.getDate().toString().padStart(2, '0')}.${(d.getMonth() + 1).toString().padStart(2, '0')}.${d.getFullYear()}`;

            const nextTransaction = {
                ...transaction,
                id: timestamp + 1,
                homeId: homeId,
                date: nextMonthDate,
                status: 'pending',
                createdAt: new Date().toISOString(),
            };
            updatedTransactions = [nextTransaction, ...updatedTransactions];
        }

        setTransactions(updatedTransactions);
        await saveTransactions(updatedTransactions);

        // Add XP for transaction
        if (addXP) await addXP(10);

        return mainTransaction;
    };

    const editTransaction = async (id, updatedData) => {
        const newTransactions = transactions.map(t =>
            t.id === id ? { ...t, ...updatedData } : t
        );
        setTransactions(newTransactions);
        await saveTransactions(newTransactions);
    };

    const completeTransaction = async (id) => {
        const transaction = transactions.find(t => t.id === id);
        if (!transaction) return;

        let newTransactions = transactions.map(t =>
            t.id === id ? { ...t, status: 'completed' } : t
        );

        // If it's recurring, schedule the NEXT one
        if (transaction.isRecurring) {
            const parts = transaction.date.split('.');
            let d = new Date(parts[2], parts[1] - 1, parts[0]);
            d.setMonth(d.getMonth() + 1);
            const nextDate = `${d.getDate().toString().padStart(2, '0')}.${(d.getMonth() + 1).toString().padStart(2, '0')}.${d.getFullYear()}`;

            const nextTransaction = {
                ...transaction,
                id: Date.now(),
                date: nextDate,
                status: 'pending',
                createdAt: new Date().toISOString(),
            };
            newTransactions = [nextTransaction, ...newTransactions];
        }

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
            .filter(t => t.type === 'income' && t.status !== 'pending')
            .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);

        const expense = filtered
            .filter(t => t.type === 'expense' && t.status !== 'pending')
            .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);

        return {
            income,
            expense,
            balance: income - expense,
            transactionCount: filtered.length,
        };
    }, [transactions]);

    const getTotalBalance = React.useCallback((homeId) => {
        return transactions
            .filter(t => (!homeId || String(t.homeId) === String(homeId)) && t.status !== 'pending')
            .reduce((sum, t) => {
                const amount = Number(t.amount) || 0;
                return t.type === 'income' ? sum + amount : sum - amount;
            }, 0);
    }, [transactions]);

    const getCategoryBreakdown = React.useCallback((homeId, type = 'expense', month = new Date().getMonth(), year = new Date().getFullYear()) => {
        const filtered = transactions.filter(t => {
            if (homeId && String(t.homeId) !== String(homeId)) return false;
            if (t.type !== type) return false;
            if (t.status === 'pending') return false; // Don't show in breakdown
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
            completeTransaction,
            deleteTransaction,
            // Savings actions
            addSavingsGoal,
            updateSavingsGoal,
            deleteSavingsGoal,
            // Computed
            getMonthlyStats,
            getTotalBalance,
            getCategoryBreakdown,
            getRecentTransactions,
            getMonthlyTrend,
        }}>

            {children}
        </FinanceContext.Provider>
    );
};
