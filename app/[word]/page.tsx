"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { BackButton } from "@/components/BackButton";
import { ThemeToggle } from "@/components/ThemeToggle";
import { SourceCard } from "@/components/SourceCard";
import { AIButton } from "@/components/AIButton";
import { getWordData } from "@/lib/mockData";

interface NisanyanData {
    note?: string;
    meaning?: string;
    origin?: string;
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
            setNisanyanData({
                origin: mockData.nisanyan.origin,
                meaning: mockData.nisanyan.meaning,
                note: mockData.nisanyan.note,
            });
            setNisanyanLoading(false);
            return;
        }

        async function fetchNisanyan() {
            try {
                const response = await fetch(`/api/nisanyan?word=${encodeURIComponent(word)}`);
                if (!response.ok) throw new Error("Not found");
                const json = await response.json();
                if (json.success && json.data) {
                    const data = json.data;
                    setNisanyanData({
                        origin: typeof data.origin === 'string' ? data.origin : '',
                        meaning: typeof data.meaning === 'string' ? data.meaning : '',
                        note: typeof data.note === 'string' ? data.note : '',
                    });
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

    return (
        <main className="result-page">
            <BackButton />
            <ThemeToggle />

            <div className="container">
                <header className="word-header">
                    <h1 className="word-title">{word}</h1>
                    {tdkLoading ? (
                        <p className="word-definition text-muted">Yükleniyor...</p>
                    ) : tdkData?.definition ? (
                        <>
                            <p className="word-definition text-muted">
                                {tdkData.definition}
                            </p>
                            {tdkData.etymology && (
                                <p className="word-origin text-subtle" style={{ marginTop: "8px", fontSize: "0.9em" }}>
                                    Köken: {tdkData.etymology}
                                </p>
                            )}
                        </>
                    ) : null}
                </header>

                <section className="sources-section">

                    {/* Nisanyan Card */}
                    {nisanyanLoading ? (
                        <div className="source-card source-card--nisanyan">
                            <div className="source-card__header">
                                <div className="loading-spinner" />
                                Nisanyan Sözlük
                            </div>
                            <p className="text-muted">Yükleniyor...</p>
                        </div>
                    ) : (
                        <SourceCard source="nisanyan" error={nisanyanError}>
                            {nisanyanData && (
                                <>
                                    {nisanyanData.origin && (
                                        <p><strong>Köken:</strong> {nisanyanData.origin}</p>
                                    )}
                                    {nisanyanData.meaning && (
                                        <p><strong>Anlam:</strong> {nisanyanData.meaning}</p>
                                    )}
                                    {nisanyanData.note && (
                                        <p className="text-muted" style={{ marginTop: "8px", fontSize: "0.9em" }}>
                                            {nisanyanData.note}
                                        </p>
                                    )}
                                </>
                            )}
                        </SourceCard>
                    )}

                    {/* Aksözlük Card */}
                    {aksozlukLoading ? (
                        <div className="source-card source-card--aksozluk">
                            <div className="source-card__header">
                                <div className="loading-spinner" />
                                Aksözlük
                            </div>
                            <p className="text-muted">Yükleniyor...</p>
                        </div>
                    ) : (
                        <SourceCard source="aksozluk" error={aksozlukError}>
                            {aksozlukData?.content && (
                                <p>{aksozlukData.content}</p>
                            )}
                        </SourceCard>
                    )}

                    {/* Etimoloji Türkçe Card */}
                    {etimolojitrLoading ? (
                        <div className="source-card source-card--etimolojitr">
                            <div className="source-card__header">
                                <div className="loading-spinner" />
                                Etimoloji Türkçe
                            </div>
                            <p className="text-muted">Yükleniyor...</p>
                        </div>
                    ) : (
                        <SourceCard source="etimolojitr" error={etimolojitrError}>
                            {etimolojitrData && (
                                <>
                                    {etimolojitrData.origin && (
                                        <p>{etimolojitrData.origin}</p>
                                    )}
                                    {etimolojitrData.oldestSource && (
                                        <p className="text-muted" style={{ marginTop: "8px", fontSize: "0.9em" }}>
                                            <strong>En Eski Kaynak:</strong> {etimolojitrData.oldestSource}
                                        </p>
                                    )}
                                </>
                            )}
                        </SourceCard>
                    )}
                </section>

                <AIButton word={word} />
            </div>
        </main>
    );
}
