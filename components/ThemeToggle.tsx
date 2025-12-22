"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "./ThemeProvider";

export function ThemeToggle() {
    const { theme, toggleTheme, mounted } = useTheme();

    // Don't render anything until mounted (prevents hydration mismatch)
    if (!mounted) {
        return <div className="theme-toggle" style={{ opacity: 0 }} />;
    }

    return (
        <button
            onClick={toggleTheme}
            className="theme-toggle glass-button"
            aria-label={theme === "light" ? "Karanlık moda geç" : "Aydınlık moda geç"}
        >
            {theme === "light" ? <Moon size={20} /> : <Sun size={20} />}
        </button>
    );
}
