import { NextResponse } from 'next/server';

interface Etymology {
    languages: string[];
    originalText: string;
    romanizedText: string;
    definition: string;
    relation: string;
    paranthesis?: string;
}

// Convert %b, %i, %u format codes to clean text
function formatText(text: string): string {
    if (!text) return '';
    return text.replace(/%[biu]/g, '');
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
                'Accept': 'application/json',
            },
        });

        if (!response.ok) {
            return NextResponse.json({ error: 'Word not found' }, { status: 404 });
        }

        const text = await response.text();
        const lines = text.trim().split('\n');

        // Find the chunk with id: 2 which contains word data
        let wordDataChunk: any = null;
        for (const line of lines) {
            try {
                const parsed = JSON.parse(line);
                if (parsed && parsed.type === 'chunk' && parsed.id === 2 && Array.isArray(parsed.data)) {
                    wordDataChunk = parsed;
                    break;
                }
            } catch {
                continue;
            }
        }

        if (!wordDataChunk || !wordDataChunk.data) {
            return NextResponse.json({ error: 'No etymology data found' }, { status: 404 });
        }

        const data = wordDataChunk.data;

        // Structure: 
        // data[0] = { data: 1, error: 15 } -> points to data[1]
        // data[1] = [2] -> array pointing to data[2]
        // data[2] = { name: 3, note: 4, etymologies: 6, ... } -> structure map with indices
        // data[3] = "insan" (word name)
        // data[4] = note text
        // data[6] = [7, 29, 43, ...] -> array of etymology indices
        // data[7] = first etymology object with indices

        // Get structure map at index 2
        const structureMap = data[2];
        if (!structureMap || typeof structureMap !== 'object') {
            return NextResponse.json({ error: 'Invalid data structure' }, { status: 500 });
        }

        // Resolve simple indices
        const resolveIndex = (idx: number | string | null | undefined): any => {
            if (idx === null || idx === undefined) return null;
            if (typeof idx === 'string') return idx;
            if (typeof idx === 'number' && idx < data.length) {
                return data[idx];
            }
            return null;
        };

        // Get the word name
        const wordName = resolveIndex(structureMap.name) || word;

        // Get the note (additional info)
        const note = resolveIndex(structureMap.note) || '';

        // Get etymologies array
        const etymologiesIndices = resolveIndex(structureMap.etymologies);
        const etymologies: Etymology[] = [];

        if (Array.isArray(etymologiesIndices)) {
            for (const etymIndex of etymologiesIndices) {
                if (typeof etymIndex === 'number' && data[etymIndex]) {
                    const etymStruct = data[etymIndex];

                    // Each etymology has its own structure with indices
                    // etymStruct.originalText -> index to actual text
                    // etymStruct.romanizedText -> index to actual text
                    // etc.

                    const originalText = resolveIndex(etymStruct.originalText) || '';
                    const romanizedText = resolveIndex(etymStruct.romanizedText) || '';
                    const definition = resolveIndex(etymStruct.definition) || '';
                    const paranthesis = resolveIndex(etymStruct.paranthesis) || '';

                    // Get relation
                    const relationStruct = resolveIndex(etymStruct.relation);
                    const relationText = relationStruct ? resolveIndex(relationStruct.text) || '' : '';

                    // Get languages
                    const languagesArray = resolveIndex(etymStruct.languages);
                    const languages: string[] = [];
                    if (Array.isArray(languagesArray)) {
                        for (const langIdx of languagesArray) {
                            const langStruct = resolveIndex(langIdx);
                            if (langStruct) {
                                const langName = resolveIndex(langStruct.name);
                                if (langName) languages.push(langName);
                            }
                        }
                    }

                    etymologies.push({
                        languages,
                        originalText,
                        romanizedText,
                        definition,
                        relation: relationText,
                        paranthesis,
                    });
                }
            }
        }

        // Build the full etymology text
        let fullText = '';
        let isInParenthesis = false;

        for (const etym of etymologies) {
            if (etym.paranthesis === '(') {
                fullText += '(NOT: ';
                isInParenthesis = true;
            }

            // Language
            if (etym.languages.length > 0) {
                fullText += etym.languages.join('-') + ' ';
            }

            // Romanized text (the root)
            if (etym.romanizedText) {
                fullText += etym.romanizedText + ' ';
            }

            // Original script
            if (etym.originalText) {
                fullText += etym.originalText + ' ';
            }

            // Definition
            if (etym.definition && etym.definition !== 'a.a.') {
                fullText += `"${etym.definition}" `;
            } else if (etym.definition === 'a.a.') {
                fullText += '(aynı anlam) ';
            }

            // Relation
            if (etym.relation) {
                fullText += etym.relation + ' ';
            }

            if (etym.paranthesis === ')') {
                fullText = fullText.trim() + ') ';
                isInParenthesis = false;
            }
        }

        fullText = fullText.trim();

        // Add note if present
        const cleanNote = formatText(note);
        if (cleanNote) {
            fullText += '\n\n' + cleanNote;
        }

        return NextResponse.json({
            source: 'nisanyan',
            word: wordName,
            data: {
                origin: fullText || formatText(note),
                meaning: etymologies[0]?.definition || '',
                note: cleanNote,
                etymologies,
            },
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
