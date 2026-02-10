import { useState, useEffect } from "react";

export function useHistory() {
    const [history, setHistory] = useState([]);

    useEffect(() => {
        const saved = localStorage.getItem("musicDistectorHistory");
        if (saved) {
            setHistory(JSON.parse(saved));
        }
    }, []);

    const addToHistory = (song) => {
        if (!song) return;

        // Create new item with timestamp
        const newItem = { ...song, detectedAt: new Date().toISOString() };

        // Update state and local storage
        const newHistory = [newItem, ...history].slice(0, 20); // Keep last 20
        setHistory(newHistory);
        localStorage.setItem("musicDistectorHistory", JSON.stringify(newHistory));
    };

    const removeFromHistory = (index) => {
        const newHistory = history.filter((_, i) => i !== index);
        setHistory(newHistory);
        localStorage.setItem("musicDistectorHistory", JSON.stringify(newHistory));
    };

    const clearHistory = () => {
        setHistory([]);
        localStorage.removeItem("musicDistectorHistory");
    };

    return { history, addToHistory, removeFromHistory, clearHistory };
}
