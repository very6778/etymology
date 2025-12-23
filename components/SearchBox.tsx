"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { usePageTransition } from "./PageTransitionProvider";

export function SearchBox() {
    const [query, setQuery] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const router = useRouter();
    const { startTransition } = usePageTransition();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const trimmed = query.trim();
        if (trimmed && !isSubmitting) {
            setIsSubmitting(true);
            startTransition(trimmed);

            // Wait for exit animation
            await new Promise(resolve => setTimeout(resolve, 600));

            router.push(`/${encodeURIComponent(trimmed)}`);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="search-box">
            <AnimatePresence mode="wait">
                {!isSubmitting ? (
                    <motion.div
                        key="search-input"
                        className="search-box__inner"
                        initial={{ opacity: 0, y: 10, filter: "blur(4px)" }}
                        animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                        exit={{
                            opacity: 0,
                            scale: 0.98,
                            filter: "blur(12px)", // Strong blur for "mist" effect
                            y: -10 // Slight movement up
                        }}
                        transition={{
                            duration: 0.6,
                            ease: [0.33, 1, 0.68, 1] // Cubic Bezier for smooth feel
                        }}
                    >
                        <Search className="search-icon" size={20} />
                        <input
                            type="text"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder="Kelime ara..."
                            className="search-input"
                            autoFocus
                            autoComplete="off"
                            spellCheck={false}
                        />
                    </motion.div>
                ) : (
                    // Empty state during transition - purely exit animation
                    <motion.div
                        key="spacer"
                        className="search-box__inner"
                        style={{ height: 52 }}
                    />
                )}
            </AnimatePresence>
        </form>
    );
}
