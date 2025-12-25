import { NextResponse } from 'next/server';
import * as cheerio from 'cheerio';

// Convert Turkish characters to URL-friendly format
function turkishToAscii(str: string): string {
    const charMap: Record<string, string> = {
        'ç': 'c', 'Ç': 'C',
        'ğ': 'g', 'Ğ': 'G',
        'ı': 'i', 'İ': 'I',
        'ö': 'o', 'Ö': 'O',
        'ş': 's', 'Ş': 'S',
        'ü': 'u', 'Ü': 'U',
    };

    return str.split('').map(char => charMap[char] || char).join('').toLowerCase();
}

interface AksozlukData {
    content: string;
    date?: string;
}

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const word = searchParams.get('word');

    if (!word) {
        return NextResponse.json({ error: 'Word parameter is required' }, { status: 400 });
    }

    try {
        const urlWord = turkishToAscii(word);

        // Generate variations to fetch parallel: base word + numbered variations (homonyms)
        // e.g. "bag", "bag-1", "bag-2", "bag-3"
        const variations = [
            urlWord,
            `${urlWord}-1`,
            `${urlWord}-2`,
            `${urlWord}-3`
        ];

        // Fetch all variations in parallel
        const responses = await Promise.all(
            variations.map(async (v) => {
                const url = `https://aksozluk.org/${v}`;
                try {
                    const res = await fetch(url, {
                        headers: { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36' }
                    });
                    if (!res.ok) return null;
                    const text = await res.text();
                    return { html: text, url: url };
                } catch (e) {
                    return null;
                }
            })
        );

        // Process successful results
        const validContents: string[] = [];

        for (const response of responses) {
            if (!response) continue;

            const $ = cheerio.load(response.html);

            // Extract content, same cleaning logic as before
            let content = $('article').text().trim(); // Fallback
            const paragraphs = $('article p').map((_, el) => $(el).html()?.trim()).get();
            if (paragraphs.length > 0) content = paragraphs.join(' ').trim();

            if (!content) continue;

            // Cleaning logic
            content = content.replace(/^(\s*(<[^>]+>\s*)*)\d{1,2}\s+(Ocak|Şubat|Mart|Nisan|Mayıs|Haziran|Temmuz|Ağustos|Eylül|Ekim|Kasım|Aralık)\s+\d{4}\s*/i, '$1');
            content = content.replace(/<a\b[^>]*>(.*?)<\/a>/gi, '$1');
            content = content.replace(/\s*style="[^"]*"/gi, '');
            content = content.replace(/\s*style='[^']*'/gi, '');

            // Extensive whitespace/junk cleanup
            content = content.replace(/<span[^>]*>(\s|&nbsp;)*<\/span>/gi, '');
            content = content.replace(/(<span[^>]*>)(\s|&nbsp;)+/gi, '$1');
            let prev = '';
            while (prev !== content) {
                prev = content;
                content = content.replace(/^(\s|&nbsp;)+/gi, '');
                content = content.replace(/^<span[^>]*>(\s|&nbsp;)*<\/span>/gi, '');
            }
            content = content.trim();

            if (content && content.length > 10) {
                validContents.push(content);
            }
        }

        if (validContents.length === 0) {
            return NextResponse.json({ error: 'Word not found' }, { status: 404 });
        }

        // Merge all found contents with a separator
        // We use a custom divider that we can style in frontend or just breaks
        const mergedContent = validContents.join('<div class="etymology-divider">***</div>');

        const aksozlukData: AksozlukData = {
            content: mergedContent,
        };

        return NextResponse.json({
            source: 'aksozluk',
            word,
            data: aksozlukData,
            success: true
        });

    } catch (error) {
        console.error('Aksözlük scraping error:', error);
        return NextResponse.json(
            { error: 'Failed to fetch data from Aksözlük' },
            { status: 500 }
        );
    }
}
