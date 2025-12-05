import React, { useState, useEffect } from 'react';

export function useLocalStorage<T>(key: string, initialValue: T): [T, React.Dispatch<React.SetStateAction<T>>, boolean] {
    const [hydrated, setHydrated] = useState(false);
    const [storedValue, setStoredValue] = useState<T>(initialValue);

    useEffect(() => {
        if (typeof window === 'undefined') return;
        try {
            const item = localStorage.getItem(key);
            if (item) {
                setStoredValue(JSON.parse(item));
            }
        } catch (error) {
            console.warn(`Error reading localStorage key "${key}":`, error);
        } finally {
            setHydrated(true);
        }
    }, [key]);

    useEffect(() => {
        if (!hydrated || typeof window === 'undefined') return;
        try {
            localStorage.setItem(key, JSON.stringify(storedValue));
        } catch (error) {
            if (error instanceof DOMException && (error.name === 'QuotaExceededError' || error.name === 'NS_ERROR_DOM_QUOTA_REACHED')) {
                console.error(`LocalStorage quota exceeded for key "${key}". Data will not be saved.`);
                // Optional: You could try to clear old data or notify the user here
            } else {
                console.warn(`Error setting localStorage key "${key}":`, error);
            }
        }
    }, [key, storedValue, hydrated]);

    return [storedValue, setStoredValue, hydrated];
}
