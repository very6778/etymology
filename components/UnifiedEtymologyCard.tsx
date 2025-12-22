"use client";

import { useState } from "react";
import { Scroll, Book, Languages, AlertCircle } from "lucide-react";
import { useSensoryFeedback } from "@/hooks/useSensoryFeedback";

export type SourceType = "nisanyan" | "aksozluk" | "etimolojitr";

interface NisanyanLanguage {
    name: string;
    abbreviation: string;
    description?: string;
}

interface NisanyanRelation {
    name: string;
    abbreviation: string;
    text: string;
}

interface NisanyanEtymology {
    languages: NisanyanLanguage[];
    originalText: string;
    romanizedText: string;
    definition: string;
    relation: NisanyanRelation;
    paranthesis?: string;
}

interface NisanyanWord {
    etymologies: NisanyanEtymology[];
    note?: string;
    relatedWords?: string[];
}

interface NisanyanData {
    words: NisanyanWord[];
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

// HTML-aware paragraph formatting: splits HTML content at sentence boundaries
// while preserving HTML tags. Works by finding ". " in the text content.
const formatHtmlWithParagraphs = (html: string): string[] => {
    if (!html || html.length <= 200) return [html];

    const paragraphs: string[] = [];
    let remaining = html;
    let splits = 0;
    const maxSplits = 2;

    while (remaining.length > 0 && splits < maxSplits) {
        // Get text-only length to check if we need to split
        const textOnly = remaining.replace(/<[^>]+>/g, '');
        if (textOnly.length <= 200) {
            paragraphs.push(remaining.trim());
            remaining = '';
            break;
        }

        // Find ". " in text content, but we need to find it in original HTML
        // Strategy: Walk through the HTML, track text position, find the split point
        let textPos = 0;
        let splitIndex = -1;

        for (let i = 0; i < remaining.length; i++) {
            if (remaining[i] === '<') {
                // Skip HTML tag
                const tagEnd = remaining.indexOf('>', i);
                if (tagEnd !== -1) {
                    i = tagEnd;
                    continue;
                }
            }

            textPos++;

            // Look for ". " after ~150 text chars
            if (textPos >= 150 && remaining.substring(i, i + 2) === '. ') {
                splitIndex = i + 1; // Include the period
                break;
            }

            // Don't search beyond 350 text chars
            if (textPos > 350) break;
        }

        if (splitIndex !== -1) {
            paragraphs.push(remaining.substring(0, splitIndex).trim());
            remaining = remaining.substring(splitIndex + 1).trim();
            splits++;
        } else {
            // No suitable split found
            break;
        }
    }

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
            x: direction > 0 ? "100%" : "-100%",
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
            x: direction < 0 ? "100%" : "-100%",
            opacity: 0,
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
        if (!data.words || data.words.length === 0) {
            return (
                <div className="unified-card__error">
                    <span>bu kelime için veri bulunamadı</span>
                </div>
            );
        }

        const wordData = data.words[0];
        const etymologies = wordData.etymologies || [];

        // Construct the etymology text from structured data
        let construction = "";

        if (etymologies.length > 0) {
            etymologies.forEach((etym, index) => {
                const lang = etym.languages && etym.languages.length > 0 ? etym.languages[0].name : "";
                const word = etym.romanizedText || etym.originalText || "";
                const def = etym.definition && etym.definition !== "a.a." ? `"${etym.definition}"` : "";
                const relation = etym.relation ? etym.relation.text : "";

                // Build sentence part
                // Example: "Eski Türkçe" + "alma" + "sözcüğünden evrilmiştir."
                let part = "";
                if (lang) part += `<span class="etym-lang">${lang}</span> `;
                if (word) part += `<b>${word}</b> `;
                if (def) part += `${def} `;
                if (relation) part += `${relation} `;

                construction += part;
            });
        }

        // Basic cleanup of the constructed text
        const mainText = construction.replace(/\s+/g, " ").trim();
        const note = wordData.note;

        return (
            <div className="tab-content">
                <div className="etymology-content">
                    {/* We use a different rendering here because we have HTML tags now, but formatTextWithParagraphs splits by text. 
                        For now, let's strip tags for valid paragraph splitting or just render safely. 
                        Actually, let's keep it simple: Render the constructed text as one block or handle it nicely.
                    */}
                    <p dangerouslySetInnerHTML={{ __html: mainText }} />

                    {note && (
                        <div className="etymology-note">
                            <div className="etymology-note__label">not</div>
                            <div className="etymology-note__content">{note}</div>
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

        const paragraphs = formatHtmlWithParagraphs(data.content);

        return (
            <div className="tab-content">
                <div className="etymology-content">
                    {paragraphs.map((p, i) => (
                        <p key={i} dangerouslySetInnerHTML={{ __html: p }} />
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
        const paragraphs = formatHtmlWithParagraphs(mainContent);

        return (
            <div className="tab-content">
                <div className="etymology-content">
                    {paragraphs.map((p, i) => (
                        <p key={i} dangerouslySetInnerHTML={{ __html: p }} />
                    ))}
                    {data.oldestSource && (
                        <div className="etymology-note">
                            <div className="etymology-note__label">en eski kaynak</div>
                            <div className="etymology-note__content">
                                <span dangerouslySetInnerHTML={{ __html: data.oldestSource }} />
                            </div>
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
            <motion.div
                className="unified-card__body"
                layout
                style={{ position: 'relative', overflow: 'hidden' }}
                transition={{ duration: 0.3, type: "spring", stiffness: 200, damping: 25 }}
            >
                <AnimatePresence initial={false} custom={direction} mode="popLayout">
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
            </motion.div>
        </div>
    );
}
