"use client";

import { BackButton } from "@/components/BackButton";
import { ThemeToggle } from "@/components/ThemeToggle";
import { UnifiedEtymologyCard } from "@/components/UnifiedEtymologyCard";
import { motion } from "framer-motion";
import { useEffect } from "react";
import { usePageTransition } from "@/components/PageTransitionProvider";

interface TDKData {
    definition?: string;
    type?: string;
}

interface WordPageClientProps {
    word: string;
    tdkData: TDKData | null;
}

export function WordPageClient({ word, tdkData }: WordPageClientProps) {
    const { endTransition } = usePageTransition();

    useEffect(() => {
        endTransition();
    }, [endTransition]);

    const MIST_TRANSITION = {
        duration: 0.8,
        ease: [0.33, 1, 0.68, 1] as const
    };

    return (
        <main className="result-page">
            <BackButton />
            <ThemeToggle />

            <div className="container">
                <header className="word-header">
                    {/* Word Title */}
                    <motion.h1
                        className="word-title"
                        initial={{ opacity: 0, y: 15, filter: "blur(10px)" }}
                        animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                        transition={{
                            ...MIST_TRANSITION,
                            delay: 0.1
                        }}
                    >
                        {word}
                    </motion.h1>

                    {/* Definition - from server-fetched TDK */}
                    <motion.div
                        initial={{ opacity: 0, y: 15, filter: "blur(5px)" }}
                        animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                        transition={{
                            ...MIST_TRANSITION,
                            delay: 0.25
                        }}
                    >
                        {tdkData?.definition ? (
                            <p className="word-definition text-muted">
                                {tdkData.definition}
                            </p>
                        ) : null}
                    </motion.div>
                </header>

                {/* Main Card - fetches its own data client-side */}
                <motion.section
                    className="sources-section"
                    initial={{ opacity: 0, y: 30, filter: "blur(4px)" }}
                    animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                    transition={{
                        ...MIST_TRANSITION,
                        delay: 0.4
                    }}
                >
                    <UnifiedEtymologyCard word={word} />
                </motion.section>
            </div>
        </main>
    );
}
