import { WordPageClient } from "@/components/WordPageClient";
import { getWordData } from "@/lib/mockData";

interface TDKData {
    definition?: string;
    type?: string;
}

// Helper to safely fetch with error handling
async function safeFetch<T>(url: string): Promise<T | null> {
    try {
        const response = await fetch(url, { cache: 'no-store' });
        if (!response.ok) return null;
        return await response.json();
    } catch {
        return null;
    }
}

interface PageProps {
    params: Promise<{ word: string }>;
}

export default async function WordPage({ params }: PageProps) {
    const { word: rawWord } = await params;
    const word = decodeURIComponent(rawWord);
    const mockData = getWordData(word);

    // Get the base URL for API calls
    const baseUrl = process.env.VERCEL_URL
        ? `https://${process.env.VERCEL_URL}`
        : 'http://localhost:3000';

    // Only fetch TDK on server (for header definition) - fast, 1 request
    let tdkData: TDKData | null = null;

    if (mockData?.tdk) {
        tdkData = { definition: mockData.tdk.definition, type: mockData.tdk.type };
    } else {
        const tdkResult = await safeFetch<{ success: boolean; data: TDKData }>(
            `${baseUrl}/api/tdk?word=${encodeURIComponent(word)}`
        );
        tdkData = tdkResult?.success ? tdkResult.data : null;
    }

    // Etymology sources are fetched client-side by UnifiedEtymologyCard
    return (
        <WordPageClient
            word={word}
            tdkData={tdkData}
        />
    );
}
