"use client";

import { createContext, useContext, useState, ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface TransitionContextType {
    isTransitioning: boolean;
    transitionWord: string;
    startTransition: (word: string) => void;
    endTransition: () => void;
}

const TransitionContext = createContext<TransitionContextType>({
    isTransitioning: false,
    transitionWord: "",
    startTransition: () => { },
    endTransition: () => { },
});

export function usePageTransition() {
    return useContext(TransitionContext);
}

export function PageTransitionProvider({ children }: { children: ReactNode }) {
    const [isTransitioning, setIsTransitioning] = useState(false);
    const [transitionWord, setTransitionWord] = useState("");

    const startTransition = (word: string) => {
        setTransitionWord(word);
        setIsTransitioning(true);
    };

    const endTransition = () => {
        setIsTransitioning(false);
        setTransitionWord("");
    };

    return (
        <TransitionContext.Provider
            value={{ isTransitioning, transitionWord, startTransition, endTransition }}
        >
            {children}

            {/* Cinematic Crossfade Overlay */}
            <AnimatePresence>
                {isTransitioning && (
                    <motion.div
                        className="transition-overlay"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{
                            duration: 0.4,
                            ease: "easeOut"
                        }}
                    />
                )}
            </AnimatePresence>
        </TransitionContext.Provider>
    );
}
