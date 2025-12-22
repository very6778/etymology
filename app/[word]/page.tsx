"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { BackButton } from "@/components/BackButton";
import { ThemeToggle } from "@/components/ThemeToggle";
import { UnifiedEtymologyCard } from "@/components/UnifiedEtymologyCard";
import { getWordData } from "@/lib/mockData";

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

export default function WordPage() {
    const params = useParams();
    const word = decodeURIComponent(params.word as string);

    // Mock data (for design testing with specific words like "hürriyet")
    const mockData = getWordData(word);

    // Nisanyan state
    const [nisanyanData, setNisanyanData] = useState<NisanyanData | null>(null);
    const [nisanyanLoading, setNisanyanLoading] = useState(true);
    const [nisanyanError, setNisanyanError] = useState(false);

    // TDK state
    const [tdkData, setTdkData] = useState<TDKData | null>(null);
    const [tdkLoading, setTdkLoading] = useState(true);
    const [tdkError, setTdkError] = useState(false);

    // Aksözlük state
    const [aksozlukData, setAksozlukData] = useState<AksozlukData | null>(null);
    const [aksozlukLoading, setAksozlukLoading] = useState(true);
    const [aksozlukError, setAksozlukError] = useState(false);

    // Etimoloji Türkçe state
    const [etimolojitrData, setEtimolojitrData] = useState<EtimolojiTRData | null>(null);
    const [etimolojitrLoading, setEtimolojitrLoading] = useState(true);
    const [etimolojitrError, setEtimolojitrError] = useState(false);

    // Fetch Nisanyan data
    useEffect(() => {
        if (mockData?.nisanyan) {
            // Mock data structure might be outdated, but handling it is optional for now 
            // or we can map it if we really need mock testing.
            // For now, let's skip mock mapping for Nisanyan or do a minimal map if needed.
            setNisanyanLoading(false);
            // return; // Commented out to force real fetch for this feature upgrade
        }

        async function fetchNisanyan() {
            try {
                const response = await fetch(`/api/nisanyan?word=${encodeURIComponent(word)}`);
                if (!response.ok) throw new Error("Not found");
                const json = await response.json();

                if (json.words && json.words.length > 0) {
                    setNisanyanData(json);
                } else {
                    setNisanyanError(true);
                }
            } catch {
                setNisanyanError(true);
            } finally {
                setNisanyanLoading(false);
            }
        }

        fetchNisanyan();
    }, [word, mockData]);

    // Fetch TDK data
    useEffect(() => {
        if (mockData?.tdk) {
            setTdkData({
                definition: mockData.tdk.definition,
                type: mockData.tdk.type,
            });
            setTdkLoading(false);
            return;
        }

        async function fetchTDK() {
            try {
                const response = await fetch(`/api/tdk?word=${encodeURIComponent(word)}`);
                if (!response.ok) throw new Error("Not found");
                const json = await response.json();
                if (json.success && json.data) {
                    setTdkData(json.data);
                } else {
                    setTdkError(true);
                }
            } catch {
                setTdkError(true);
            } finally {
                setTdkLoading(false);
            }
        }

        fetchTDK();
    }, [word, mockData]);

    // Fetch Aksözlük data
    useEffect(() => {
        if (mockData?.aksozluk) {
            setAksozlukData({ content: mockData.aksozluk.content });
            setAksozlukLoading(false);
            return;
        }

        async function fetchAksozluk() {
            try {
                const response = await fetch(`/api/aksozluk?word=${encodeURIComponent(word)}`);
                if (!response.ok) throw new Error("Not found");
                const json = await response.json();
                if (json.success && json.data) {
                    setAksozlukData(json.data);
                } else {
                    setAksozlukError(true);
                }
            } catch {
                setAksozlukError(true);
            } finally {
                setAksozlukLoading(false);
            }
        }

        fetchAksozluk();
    }, [word, mockData]);

    // Fetch Etimoloji Türkçe data
    useEffect(() => {
        if (mockData?.etimolojitr) {
            setEtimolojitrData({ content: mockData.etimolojitr.content });
            setEtimolojitrLoading(false);
            return;
        }

        async function fetchEtimolojitr() {
            try {
                const response = await fetch(`/api/etimolojitr?word=${encodeURIComponent(word)}`);
                if (!response.ok) throw new Error("Not found");
                const json = await response.json();
                if (json.success && json.data) {
                    setEtimolojitrData(json.data);
                } else {
                    setEtimolojitrError(true);
                }
            } catch {
                setEtimolojitrError(true);
            } finally {
                setEtimolojitrLoading(false);
            }
        }

        fetchEtimolojitr();
    }, [word, mockData]);

    // Prepare sources data for UnifiedEtymologyCard
    const sources = {
        nisanyan: {
            data: nisanyanData,
            loading: nisanyanLoading,
            error: nisanyanError,
        },
        tdk: {
            data: tdkData,
            loading: tdkLoading,
            error: tdkError,
        },
        aksozluk: {
            data: aksozlukData,
            loading: aksozlukLoading,
            error: aksozlukError,
        },
        etimolojitr: {
            data: etimolojitrData,
            loading: etimolojitrLoading,
            error: etimolojitrError,
        },
    };

    return (
        <main className="result-page">
            <BackButton />
            <ThemeToggle />

            <div className="container">
                <header className="word-header">
                    <h1 className="word-title">{word}</h1>
                    {tdkLoading ? (
                        <p className="word-definition text-muted">yükleniyor...</p>
                    ) : tdkData?.definition ? (
                        <p className="word-definition text-muted">
                            {tdkData.definition}
                        </p>
                    ) : null}
                </header>

                <section className="sources-section">
                    <UnifiedEtymologyCard word={word} sources={sources} />
                </section>
            </div>
        </main>
    );
}
