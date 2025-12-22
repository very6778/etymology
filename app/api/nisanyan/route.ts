import { NextResponse } from 'next/server';

interface NisanyanData {
    note?: string;
    meaning?: string;
    origin?: string;
}

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const word = searchParams.get('word');

    if (!word) {
        return NextResponse.json({ error: 'Word parameter is required' }, { status: 400 });
    }

    try {
        const url = `https://www.nisanyansozluk.com/kelime/${encodeURIComponent(word)}/__data.json`;

        const response = await fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
            },
        });

        if (!response.ok) {
            return NextResponse.json({ error: 'Word not found' }, { status: 404 });
        }

        const text = await response.text();
        const lines = text.trim().split('\n');
        const parsedLines = lines.map(line => {
            try {
                return JSON.parse(line);
            } catch {
                return null;
            }
        }).filter(Boolean);

        // SvelteKit uses index-based serialization
        // The word data is in the chunk with id: 2
        const wordDataChunk = parsedLines.find((item: any) =>
            item && item.type === 'chunk' && item.id === 2 && Array.isArray(item.data)
        );

        if (!wordDataChunk || !wordDataChunk.data) {
            return NextResponse.json({ error: 'No etymology data found' }, { status: 404 });
        }

        const dataArray = wordDataChunk.data;

        // Based on analysis:
        // - note is at data[4]
        // - etymologies at data[6]
        // - first etymology definition at data[10]
        const note = dataArray[4] || '';
        const meaning = dataArray[10] || '';  // First etymology definition
        const origin = dataArray[21] || '';   // Language (e.g., "Fransızca")

        const etymologyData: NisanyanData = {
            note,
            meaning,
            origin
        };

        return NextResponse.json({
            source: 'nisanyan',
            word,
            data: etymologyData,
            success: true
        });

    } catch (error) {
        console.error('Nisanyan scraping error:', error);
        return NextResponse.json(
            { error: 'Failed to fetch data from Nisanyan' },
            { status: 500 }
        );
    }
}
