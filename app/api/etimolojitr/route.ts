import { NextResponse } from 'next/server';
import * as cheerio from 'cheerio';

interface EtimolojiTRData {
    origin?: string;
    oldestSource?: string;
    content?: string;
}

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const word = searchParams.get('word');

    if (!word) {
        return NextResponse.json({ error: 'Word parameter is required' }, { status: 400 });
    }

    try {
        const baseWord = word.toLowerCase();

        // EtimolojiTR uses patterns like "bağ", "bağ1", "bağ2" (no hyphen usually)
        const variations = [
            baseWord,
            `${baseWord}1`,
            `${baseWord}2`,
            `${baseWord}3`
        ];

        // Fetch all in parallel
        const responses = await Promise.all(
            variations.map(async (v) => {
                const url = `https://www.etimolojiturkce.com/kelime/${encodeURIComponent(v)}`;
                try {
                    const res = await fetch(url, {
                        headers: { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36' }
                    });
                    if (!res.ok) return null;
                    const text = await res.text();
                    return { html: text, url: url, variation: v };
                } catch (e) {
                    return null;
                }
            })
        );

        const validResults: EtimolojiTRData[] = [];

        for (const response of responses) {
            if (!response) continue;

            const $ = cheerio.load(response.html);
            let origin = '';
            let oldestSource = '';

            // Find "Kelime Kökeni" section
            $('h3').each((_, el) => {
                const headerText = $(el).text().trim();
                if (headerText.includes('Kelime Kökeni')) {
                    const nextP = $(el).next('p').html()?.trim();
                    if (nextP) origin = nextP;
                }
                if (headerText.includes('Tarihte En Eski Kaynak')) {
                    const nextP = $(el).next('p').html()?.trim();
                    if (nextP) oldestSource = nextP;
                }
            });

            // Fallback content logic
            if (!origin) {
                const paragraphs = $('article p, .content p, main p').map((_, el) => $(el).html()?.trim()).get();
                if (paragraphs.length > 0) origin = paragraphs.join(' ').substring(0, 800);
            }

            // Cleanup
            if (origin) {
                origin = origin.replace(/<a\b[^>]*>(.*?)<\/a>/gi, '$1');
                origin = origin.replace(/\s*style="[^"]*"/gi, '');
                origin = origin.replace(/\s*style='[^']*'/gi, '');
            }
            if (oldestSource) {
                oldestSource = oldestSource.replace(/<a\b[^>]*>(.*?)<\/a>/gi, '$1');
                oldestSource = oldestSource.replace(/\s*style="[^"]*"/gi, '');
                oldestSource = oldestSource.replace(/\s*style='[^']*'/gi, '');
            }

            if (origin || oldestSource) {
                validResults.push({
                    origin: origin || '',
                    oldestSource: oldestSource || '',
                    content: origin || oldestSource
                });
            }
        }

        if (validResults.length === 0) {
            return NextResponse.json({ error: 'No etymology content found' }, { status: 404 });
        }

        // Merge results
        // For EtimolojiTR, we might have Origin AND OldestSource for each variation.
        // We will join them block by block.

        const mergedOrigin = validResults
            .map(r => r.origin)
            .filter(Boolean)
            .join('<div class="etymology-divider">***</div>');

        const mergedOldestSource = validResults
            .map(r => r.oldestSource)
            .filter(Boolean)
            .join('<div class="etymology-divider">***</div>');

        const etimolojiData: EtimolojiTRData = {
            origin: mergedOrigin,
            oldestSource: mergedOldestSource,
            content: mergedOrigin || mergedOldestSource,
        };

        return NextResponse.json({
            source: 'etimolojitr',
            word,
            data: etimolojiData,
            success: true
        });

    } catch (error) {
        console.error('Etimoloji Türkçe scraping error:', error);
        return NextResponse.json(
            { error: 'Failed to fetch data from Etimoloji Türkçe' },
            { status: 500 }
        );
    }
}
