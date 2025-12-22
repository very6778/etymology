"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { BackButton } from "@/components/BackButton";
import { ThemeToggle } from "@/components/ThemeToggle";
import { SourceCard } from "@/components/SourceCard";
import { AIButton } from "@/components/AIButton";
import { getWordData, WordData } from "@/lib/mockData";

interface NisanyanData {
    note?: string;
    meaning?: string;
    origin?: string;
}

export default function WordPage() {
    const params = useParams();
    const word = decodeURIComponent(params.word as string);

    // Mock data for TDK, Aksözlük, Etimoloji TR (for now)
    const mockData = getWordData(word);

    // Real API data state
    const [nisanyanData, setNisanyanData] = useState<NisanyanData | null>(null);
    const [nisanyanLoading, setNisanyanLoading] = useState(true);
    const [nisanyanError, setNisanyanError] = useState(false);

    // Fetch Nisanyan data (skip for words with mock data)
    useEffect(() => {
        // If mock data exists for Nisanyan, use it instead of API
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
                    // Ensure all values are strings (API might return objects)
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

    return (
        <main className="result-page">
            <BackButton />
            <ThemeToggle />

            <div className="container">
                <header className="word-header">
                    <h1 className="word-title">{word}</h1>
                    {mockData?.tdk && (
                        <p className="word-definition text-muted">
                            {mockData.tdk.definition}
                        </p>
                    )}
                </header>

                <section className="sources-section">
                    {/* TDK Card - Still using mock data */}
                    <SourceCard source="tdk" error={!mockData?.tdk}>
                        {mockData?.tdk && (
                            <p>{mockData.tdk.definition}</p>
                        )}
                    </SourceCard>

                    {/* Nisanyan Card - Real API data */}
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

                    {/* Aksözlük Card - Still using mock data */}
                    <SourceCard source="aksozluk" error={!mockData?.aksozluk}>
                        {mockData?.aksozluk && (
                            <p>{mockData.aksozluk.content}</p>
                        )}
                    </SourceCard>

                    {/* Etimoloji Türkçe Card - Still using mock data */}
                    <SourceCard source="etimolojitr" error={!mockData?.etimolojitr}>
                        {mockData?.etimolojitr && (
                            <p>{mockData.etimolojitr.content}</p>
                        )}
                    </SourceCard>
                </section>

                <AIButton word={word} />
            </div>
        </main>
    );
}
