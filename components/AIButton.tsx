"use client";

import { useState } from "react";
import { Sparkles } from "lucide-react";

interface AIButtonProps {
    word: string;
}

// Mock AI response for now
const mockAIResponse = (word: string) => {
    const responses: Record<string, string> = {
        hürriyet: "Milletimizin hürriyet mücadelesi, tarihimizin en önemli sayfalarını oluşturur.",
        kelime: "Her kelime, bir düşüncenin somutlaşmış halidir.",
        etimoloji: "Etimoloji çalışmaları, dilin tarihsel evrimini anlamamızı sağlar.",
    };

    return responses[word.toLowerCase()] ||
        `"${word}" kelimesi, günlük hayatta sıkça karşılaştığımız kavramlardan biridir.`;
};

export function AIButton({ word }: AIButtonProps) {
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<string | null>(null);

    const handleClick = async () => {
        if (result) return; // Already generated

        setLoading(true);

        // Simulate API delay
        await new Promise((resolve) => setTimeout(resolve, 1500));

        setResult(mockAIResponse(word));
        setLoading(false);
    };

    return (
        <div className="ai-section">
            {!result && (
                <button
                    onClick={handleClick}
                    className="button button--full glass-button"
                    disabled={loading}
                >
                    {loading ? (
                        <>
                            <div className="loading-spinner" />
                            Oluşturuluyor...
                        </>
                    ) : (
                        <>
                            <Sparkles size={18} />
                            Örnek Cümle Üret
                        </>
                    )}
                </button>
            )}

            {result && (
                <div className="ai-result">
                    <p>"{result}"</p>
                </div>
            )}
        </div>
    );
}
