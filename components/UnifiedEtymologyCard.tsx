"use client";

import { useState, useEffect } from "react";
import { Scroll, Book, Globe, AlertCircle } from "lucide-react";
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

interface SourceState<T> {
    data: T | null;
    loading: boolean;
    error: boolean;
}

interface UnifiedEtymologyCardProps {
    word: string;
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
        icon: Globe,
        url: (word) => `https://www.etimolojiturkce.com/kelime/${encodeURIComponent(word)}`,
    },
};

const sourceOrder: SourceType[] = ["aksozluk", "etimolojitr", "nisanyan"];

// Language-to-color mapping for Contextual Ambience
const languageAmbience: Record<string, string> = {
    "Ar": "rgba(212, 165, 116, 0.11)",
    "İbr": "rgba(212, 165, 116, 0.11)",
    "Far": "rgba(205, 133, 133, 0.11)",
    "Hin": "rgba(205, 133, 133, 0.11)",
    "Fr": "rgba(200, 162, 200, 0.11)",
    "İt": "rgba(168, 213, 186, 0.11)",
    "İsp": "rgba(200, 162, 200, 0.11)",
    "Lat": "rgba(200, 162, 200, 0.11)",
    "Por": "rgba(200, 162, 200, 0.11)",
    "Yun": "rgba(135, 206, 235, 0.11)",
    "EYun": "rgba(135, 206, 235, 0.11)",
    "ETr": "rgba(64, 224, 208, 0.11)",
    "ETr-O": "rgba(64, 224, 208, 0.11)",
    "TTr": "rgba(64, 224, 208, 0.11)",
    "OTr": "rgba(64, 224, 208, 0.11)",
    "İng": "rgba(176, 196, 222, 0.11)",
    "Alm": "rgba(176, 196, 222, 0.11)",
    "Rus": "rgba(186, 176, 222, 0.11)",
    "default": "rgba(184, 134, 11, 0.10)"
};

const formatTextWithParagraphs = (text: string): string[] => {
    if (!text || text.length <= 200) return [text];

    const paragraphs: string[] = [];
    let remaining = text;
    let splits = 0;
    const maxSplits = 2;

    while (remaining.length > 200 && splits < maxSplits) {
        const searchWindow = remaining.substring(150, 400);
        const periodIndex = searchWindow.indexOf(". ");

        if (periodIndex !== -1) {
            const splitPoint = 150 + periodIndex + 2;
            paragraphs.push(remaining.substring(0, splitPoint).trim());
            remaining = remaining.substring(splitPoint).trim();
            splits++;
        } else {
            break;
        }
    }

    if (remaining.trim().length > 0) {
        paragraphs.push(remaining.trim());
    }

    return paragraphs.filter(p => p.length > 0);
};

// Helper to clean HTML for Aksözlük
const formatHtmlWithParagraphs = (html: string): string[] => {
    if (!html) return [];
    // Simple split by periods for now - the API already handles HTML cleaning
    const text = html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
    return formatTextWithParagraphs(text);
};

import { useDrag } from "@use-gesture/react";
import { AnimatePresence, motion } from "framer-motion";

const getOriginLanguageColor = (nisanyanData: NisanyanData | null): string => {
    if (!nisanyanData?.words?.[0]?.etymologies?.[0]?.languages?.[0]) {
        return languageAmbience["default"];
    }
    const abbreviation = nisanyanData.words[0].etymologies[0].languages[0].abbreviation;
    return languageAmbience[abbreviation] || languageAmbience["default"];
};

export function UnifiedEtymologyCard({ word }: UnifiedEtymologyCardProps) {
    const [activeTab, setActiveTab] = useState<SourceType>("aksozluk");
    const [direction, setDirection] = useState(0);
    const { triggerFeedback } = useSensoryFeedback();

    // Internal state for each source - client-side fetching
    const [nisanyan, setNisanyan] = useState<SourceState<NisanyanData>>({ data: null, loading: true, error: false });
    const [aksozluk, setAksozluk] = useState<SourceState<AksozlukData>>({ data: null, loading: true, error: false });
    const [etimolojitr, setEtimolojitr] = useState<SourceState<EtimolojiTRData>>({ data: null, loading: true, error: false });

    // Fetch all sources on mount - in parallel, independently
    useEffect(() => {
        // Aksözlük
        fetch(`/api/aksozluk?word=${encodeURIComponent(word)}`)
            .then(r => r.ok ? r.json() : Promise.reject())
            .then(j => j.success ? setAksozluk({ data: j.data, loading: false, error: false }) : setAksozluk({ data: null, loading: false, error: true }))
            .catch(() => setAksozluk({ data: null, loading: false, error: true }));

        // EtimolojiTR
        fetch(`/api/etimolojitr?word=${encodeURIComponent(word)}`)
            .then(r => r.ok ? r.json() : Promise.reject())
            .then(j => j.success ? setEtimolojitr({ data: j.data, loading: false, error: false }) : setEtimolojitr({ data: null, loading: false, error: true }))
            .catch(() => setEtimolojitr({ data: null, loading: false, error: true }));

        // Nisanyan
        fetch(`/api/nisanyan?word=${encodeURIComponent(word)}`)
            .then(r => r.ok ? r.json() : Promise.reject())
            .then(j => j.words?.length ? setNisanyan({ data: j, loading: false, error: false }) : setNisanyan({ data: null, loading: false, error: true }))
            .catch(() => setNisanyan({ data: null, loading: false, error: true }));
    }, [word]);

    // Build sources object from internal state
    const sources = {
        nisanyan,
        aksozluk,
        etimolojitr,
        tdk: { data: null, loading: false, error: false } // TDK not used in card, only for header definition
    };

    const currentSource = sources[activeTab];
    const ambienceColor = getOriginLanguageColor(sources.nisanyan.data);

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

    const bind = useDrag(({ swipe: [swipeX] }) => {
        const currentIndex = sourceOrder.indexOf(activeTab);

        if (swipeX === -1) {
            if (currentIndex < sourceOrder.length - 1) {
                const nextSource = sourceOrder[currentIndex + 1];
                setDirection(1);
                triggerFeedback();
                setActiveTab(nextSource);
            }
        } else if (swipeX === 1) {
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
            zIndex: 1,
            x: 0,
            opacity: 0,
            scale: 0.98,
            filter: "blur(4px)",
        }),
        center: {
            zIndex: 1,
            x: 0,
            opacity: 1,
            scale: 1,
            filter: "blur(0px)",
            transition: {
                opacity: { duration: 0.8, ease: "easeOut" },
                scale: { duration: 0.8, ease: [0.22, 1, 0.36, 1] },
                filter: { duration: 0.6, delay: 0.1 }
            } as any
        },
        exit: (direction: number) => ({
            zIndex: 0,
            x: 0,
            opacity: 0,
            scale: 1,
            filter: "blur(6px)",
            transition: {
                opacity: { duration: 0.4, ease: "easeOut" },
                filter: { duration: 0.4, ease: "easeOut" }
            } as any
        })
    };

    const renderContent = () => {
        if (currentSource.loading) {
            return (
                <div className="unified-card__loading" style={{ display: 'block', width: '100%', padding: '0 8px' }}>
                    <div className="skeleton skeleton-text" style={{ width: "90%", marginBottom: "12px" }} />
                    <div className="skeleton skeleton-text" style={{ width: "75%", marginBottom: "12px" }} />
                    <div className="skeleton skeleton-text" style={{ width: "85%", marginBottom: "12px" }} />
                    <div className="skeleton skeleton-text" style={{ width: "60%" }} />
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

        return (
            <div className="tab-content">
                <div className="etymology-content">
                    {data.words.map((wordData, wordIndex) => {
                        const etymologies = wordData.etymologies || [];
                        let construction = "";

                        if (etymologies.length > 0) {
                            etymologies.forEach((etym) => {
                                const lang = etym.languages && etym.languages.length > 0 ? etym.languages[0].name : "";
                                const word = etym.romanizedText || etym.originalText || "";
                                const def = etym.definition && etym.definition !== "a.a." ? `"${etym.definition}"` : "";
                                const relation = etym.relation ? etym.relation.text : "";

                                let part = "";
                                if (lang) part += `<span class="etym-lang">${lang}</span> `;
                                if (word) part += `<b>${word}</b> `;
                                if (def) part += `${def} `;
                                if (relation) part += `${relation} `;

                                construction += part;
                            });
                        }

                        const mainText = construction.replace(/\s+/g, " ").trim();
                        const note = wordData.note;

                        return (
                            <div key={wordIndex}>
                                {wordIndex > 0 && (
                                    <>
                                        <br /><br />
                                        <div className="etymology-divider">***</div>
                                        <br />
                                    </>
                                )}
                                <p dangerouslySetInnerHTML={{ __html: mainText }} />

                                {note && (
                                    <div className="etymology-note">
                                        <div className="etymology-note__label">not</div>
                                        <div className="etymology-note__content">{note}</div>
                                    </div>
                                )}
                            </div>
                        );
                    })}
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
                <div className="etymology-content" dangerouslySetInnerHTML={{ __html: data.content }} />
            </div>
        );
    };

    const renderEtimolojiTR = (data: EtimolojiTRData) => {
        const content = data.origin || data.content || "";
        const oldestSource = data.oldestSource;

        if (!content && !oldestSource) {
            return (
                <div className="unified-card__error">
                    <span>bu kelime için veri bulunamadı</span>
                </div>
            );
        }

        return (
            <div className="tab-content">
                <div className="etymology-content">
                    {content && <div dangerouslySetInnerHTML={{ __html: content }} />}

                    {oldestSource && (
                        <div className="etymology-note">
                            <div className="etymology-note__label">en eski kaynak</div>
                            <div className="etymology-note__content" dangerouslySetInnerHTML={{ __html: oldestSource }} />
                        </div>
                    )}
                </div>
            </div>
        );
    };

    // Dynamic padding for card body
    const padding = 20;

    return (
        <div className="unified-card" {...bind()} style={{ touchAction: "pan-y" }}>
            {/* Subtle Contextual Ambience - based on origin language */}
            <div
                className="unified-card__ambience"
                style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: `radial-gradient(ellipse at top, ${ambienceColor} 0%, transparent 70%)`,
                    pointerEvents: "none",
                    borderRadius: "inherit",
                    opacity: 0.8,
                    transition: "background 1s ease"
                }}
            />

            {/* Header with Tabs */}
            <div className="unified-card__header">
                <nav className="tab-nav" data-active-tab={sourceOrder.indexOf(activeTab)}>
                    {sourceOrder.map((source) => {
                        const config = sourceConfig[source];
                        const Icon = config.icon;
                        const isActive = activeTab === source;

                        return (
                            <button
                                key={source}
                                className={`tab-item ${isActive ? "tab-item--active" : ""}`}
                                onClick={() => handleTabClick(source)}
                            >
                                <Icon size={16} className="tab-item__icon" />
                                <span className="tab-item__label">{config.name}</span>
                            </button>
                        );
                    })}
                </nav>
            </div>

            {/* Card Body with Content */}
            <motion.div
                layout
                key={activeTab}
                className="unified-card__body"
                style={{
                    padding: `${padding}px ${padding}px ${padding}px ${padding}px`,
                    boxSizing: "border-box",
                }}
                transition={{
                    duration: 0.9,
                    ease: [0.22, 1, 0.36, 1],
                }}
            >
                <AnimatePresence initial={false} custom={direction}>
                    <motion.div
                        key={activeTab}
                        variants={variants}
                        custom={direction}
                        initial="enter"
                        animate="center"
                        exit="exit"
                        className="tab-content"
                    >
                        {renderContent()}
                    </motion.div>
                </AnimatePresence>
            </motion.div>
        </div>
    );
}
