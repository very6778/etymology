"use client";

import { useState } from "react";
import { Scroll, Book, Languages, AlertCircle } from "lucide-react";
import { useSensoryFeedback } from "@/hooks/useSensoryFeedback";

export type SourceType = "nisanyan" | "aksozluk" | "etimolojitr";

interface Etymology {
    languages: string[];
    originalText: string;
    romanizedText: string;
    definition: string;
    relation: string;
    paranthesis?: string;
}

interface NisanyanData {
    origin?: string;
    meaning?: string;
    note?: string;
    etymologies?: Etymology[];
}

interface TDKData {
    definition?: string;
    type?: string;
    etymology?: string;
    examples?: string[];
}

interface AksozlukData {
    content?: string;
}

interface EtimolojiTRData {
    origin?: string;
    oldestSource?: string;
    content?: string;
}

interface SourceData {
    nisanyan: {
        data: NisanyanData | null;
        loading: boolean;
        error: boolean;
    };
    tdk: {
        data: TDKData | null;
        loading: boolean;
        error: boolean;
    };
    aksozluk: {
        data: AksozlukData | null;
        loading: boolean;
        error: boolean;
    };
    etimolojitr: {
        data: EtimolojiTRData | null;
        loading: boolean;
        error: boolean;
    };
}

interface UnifiedEtymologyCardProps {
    word: string;
    sources: SourceData;
}

const sourceConfig: Record<SourceType, { name: string; icon: typeof Scroll; url: (word: string) => string }> = {
    nisanyan: {
        name: "nisanyan sözlük",
        icon: Scroll,
        url: (word) => `https://www.nisanyansozluk.com/kelime/${encodeURIComponent(word)}`,
    },
    aksozluk: {
        name: "aksözlük",
        icon: Book,
        url: (word) => `https://aksozluk.org/${encodeURIComponent(word)}`,
    },
    etimolojitr: {
        name: "etimoloji türkçe",
        icon: Languages,
        url: (word) => `https://www.etimolojiturkce.com/kelime/${encodeURIComponent(word)}`,
    },
};

const sourceOrder: SourceType[] = ["aksozluk", "etimolojitr", "nisanyan"];

// Helper function to break long text into paragraphs at ~200 char intervals (at nearest period)
// Limits to 2 splits max - first 2 paragraphs split, rest stays together
const formatTextWithParagraphs = (text: string): string[] => {
    if (!text || text.length <= 200) return [text];

    const paragraphs: string[] = [];
    let remaining = text;
    let splits = 0;
    const maxSplits = 2;

    while (remaining.length > 0 && splits < maxSplits) {
        if (remaining.length <= 200) {
            paragraphs.push(remaining.trim());
            remaining = '';
            break;
        }

        // Find the nearest period after ~180 chars (give some flexibility)
        const searchStart = 150;
        const periodIndex = remaining.indexOf('. ', searchStart);

        if (periodIndex !== -1 && periodIndex < 350) {
            // Found a period - break here (include the period)
            paragraphs.push(remaining.substring(0, periodIndex + 1).trim());
            remaining = remaining.substring(periodIndex + 2).trim();
            splits++;
        } else {
            // No period found in reasonable range - stop splitting
            break;
        }
    }

    // Add any remaining text as the final paragraph
    if (remaining.trim().length > 0) {
        paragraphs.push(remaining.trim());
    }

    return paragraphs.filter(p => p.length > 0);
};

import { useDrag } from "@use-gesture/react";
import { AnimatePresence, motion } from "framer-motion";

export function UnifiedEtymologyCard({ word, sources }: UnifiedEtymologyCardProps) {
    const [activeTab, setActiveTab] = useState<SourceType>("aksozluk");
    const [direction, setDirection] = useState(0);
    const { triggerFeedback } = useSensoryFeedback();

    const currentSource = sources[activeTab];

    const handleTabClick = (source: SourceType) => {
        if (activeTab === source) {
            window.open(sourceConfig[source].url(word), '_blank');
        } else {
            const newIndex = sourceOrder.indexOf(source);
            const oldIndex = sourceOrder.indexOf(activeTab);
            setDirection(newIndex > oldIndex ? 1 : -1);
            triggerFeedback();
            setActiveTab(source);
        }
    };

    // Swipe logic
    const bind = useDrag(({ swipe: [swipeX] }) => {
        const currentIndex = sourceOrder.indexOf(activeTab);

        if (swipeX === -1) {
            // Swipe Left -> Next Tab
            if (currentIndex < sourceOrder.length - 1) {
                const nextSource = sourceOrder[currentIndex + 1];
                setDirection(1);
                triggerFeedback();
                setActiveTab(nextSource);
            }
        } else if (swipeX === 1) {
            // Swipe Right -> Previous Tab
            if (currentIndex > 0) {
                const prevSource = sourceOrder[currentIndex - 1];
                setDirection(-1);
                triggerFeedback();
                setActiveTab(prevSource);
            }
        }
    });

    const variants = {
        enter: (direction: number) => ({
            x: direction > 0 ? 50 : -50,
            opacity: 0,
        }),
        center: {
            zIndex: 1,
            x: 0,
            opacity: 1,
            transition: {
                x: { type: "spring", stiffness: 300, damping: 30 },
                opacity: { duration: 0.2 }
            } as any
        },
        exit: (direction: number) => ({
            zIndex: 0,
            x: direction < 0 ? 50 : -50,
            opacity: 0,
            position: "absolute",
            top: 0,
            width: "100%",
            transition: {
                x: { type: "spring", stiffness: 300, damping: 30 },
                opacity: { duration: 0.2 }
            } as any
        })
    };

    const renderContent = () => {
        if (currentSource.loading) {
            return (
                <div className="unified-card__loading" style={{ display: 'block', width: '100%', padding: '0 8px' }}>
                    <div className="skeleton skeleton-text" style={{ width: "90%", marginBottom: "12px" }} />
                    <div className="skeleton skeleton-text" style={{ width: "98%", marginBottom: "12px" }} />
                    <div className="skeleton skeleton-text" style={{ width: "95%", marginBottom: "12px" }} />
                    <div className="skeleton skeleton-text" style={{ width: "85%", marginBottom: "12px" }} />
                    <div className="skeleton skeleton-text" style={{ width: "40%" }} />
                </div>
            );
        }

        if (currentSource.error || !currentSource.data) {
            return (
                <div className="unified-card__error">
                    <AlertCircle size={24} className="unified-card__error-icon" />
                    <span>şu an ulaşılamıyor</span>
                </div>
            );
        }

        switch (activeTab) {
            case "nisanyan":
                return renderNisanyan(currentSource.data as NisanyanData);
            case "aksozluk":
                return renderAksozluk(currentSource.data as AksozlukData);
            case "etimolojitr":
                return renderEtimolojiTR(currentSource.data as EtimolojiTRData);
            default:
                return null;
        }
    };

    const renderNisanyan = (data: NisanyanData) => {
        if (!data.origin && !data.note) {
            return (
                <div className="unified-card__error">
                    <span>bu kelime için veri bulunamadı</span>
                </div>
            );
        }

        return (
            <div className="tab-content">
                <div className="etymology-content">
                    {data.origin && formatTextWithParagraphs(data.origin).map((paragraph, i) => (
                        <p key={i}>{paragraph}</p>
                    ))}
                    {data.note && (
                        <div className="etymology-note">
                            <div className="etymology-note__label">not</div>
                            <div className="etymology-note__content">{data.note}</div>
                        </div>
                    )}
                </div>
            </div>
        );
    };

    const renderAksozluk = (data: AksozlukData) => {
        if (!data.content) {
            return (
                <div className="unified-card__error">
                    <span>bu kelime için veri bulunamadı</span>
                </div>
            );
        }

        return (
            <div className="tab-content">
                <div className="etymology-content">
                    {formatTextWithParagraphs(data.content).map((paragraph, i) => (
                        <p key={i}>{paragraph}</p>
                    ))}
                </div>
            </div>
        );
    };

    const renderEtimolojiTR = (data: EtimolojiTRData) => {
        if (!data.origin && !data.content) {
            return (
                <div className="unified-card__error">
                    <span>bu kelime için veri bulunamadı</span>
                </div>
            );
        }

        const mainContent = data.origin || data.content || '';

        return (
            <div className="tab-content">
                <div className="etymology-content">
                    {formatTextWithParagraphs(mainContent).map((paragraph, i) => (
                        <p key={i}>{paragraph}</p>
                    ))}
                    {data.oldestSource && (
                        <div className="etymology-note">
                            <div className="etymology-note__label">en eski kaynak</div>
                            <div className="etymology-note__content">{data.oldestSource}</div>
                        </div>
                    )}
                </div>
            </div>
        );
    };



    return (
        <div className="unified-card" {...bind()} style={{ touchAction: "pan-y" }}>
            {/* Header with Tabs */}
            <div className="unified-card__header">
                <nav className="tab-nav" data-active-tab={sourceOrder.indexOf(activeTab)}>
                    {sourceOrder.map((source) => {
                        const SourceIcon = sourceConfig[source].icon;
                        const isLoading = sources[source].loading;
                        const hasError = sources[source].error;
                        const hasData = !isLoading && !hasError && sources[source].data;
                        const isActive = activeTab === source;

                        return (
                            <button
                                key={source}
                                className={`tab-item ${isActive ? "active" : ""}`}
                                onClick={() => handleTabClick(source)}
                                title={isActive ? `${sourceConfig[source].name} - tıkla kaynağa git` : sourceConfig[source].name}
                            >
                                <SourceIcon
                                    size={16}
                                    className="tab-item__icon"
                                    style={{
                                        opacity: hasData ? 1 : hasError ? 0.3 : 0.7,
                                    }}
                                />
                                <span className="tab-item__label">
                                    {source === "nisanyan" ? "Nisanyan" :
                                        source === "aksozluk" ? "Aksözlük" : "Etimoloji TR"}
                                </span>
                            </button>
                        );
                    })}
                </nav>
            </div>

            {/* Body - Content Only */}
            <div className="unified-card__body" style={{ position: 'relative', overflow: 'hidden' }}>
                <AnimatePresence initial={false} custom={direction} mode="wait">
                    <motion.div
                        key={activeTab}
                        custom={direction}
                        variants={variants}
                        initial="enter"
                        animate="center"
                        exit="exit"
                        layout // Enables smooth height resizing
                    >
                        {renderContent()}
                    </motion.div>
                </AnimatePresence>
            </div>
        </div>
    );
}
