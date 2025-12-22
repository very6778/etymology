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
        // Etimoloji Türkçe supports Turkish characters in URL
        const url = `https://www.etimolojiturkce.com/kelime/${encodeURIComponent(word.toLowerCase())}`;

        const response = await fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
            },
        });

        if (!response.ok) {
            return NextResponse.json({ error: 'Word not found' }, { status: 404 });
        }

        const html = await response.text();
        const $ = cheerio.load(html);

        // Extract the etymology content
        // The page structure has h3 headers with sections
        let origin = '';
        let oldestSource = '';

        // Find "Kelime Kökeni" section
        $('h3').each((_, el) => {
            const headerText = $(el).text().trim();
            if (headerText.includes('Kelime Kökeni')) {
                // Get the next paragraph
                const nextP = $(el).next('p').text().trim();
                if (nextP) {
                    origin = nextP;
                }
            }
            if (headerText.includes('Tarihte En Eski Kaynak')) {
                // Get the next paragraph for oldest source
                const nextP = $(el).next('p').text().trim();
                if (nextP) {
                    oldestSource = nextP;
                }
            }
        });

        // Fallback: get all paragraphs after h1
        if (!origin) {
            const paragraphs = $('article p, .content p, main p').map((_, el) => $(el).text().trim()).get();
            origin = paragraphs.filter(p => p.length > 20).join(' ').substring(0, 500);
        }

        if (!origin && !oldestSource) {
            // Last resort: get any text content
            const bodyText = $('body').text();
            const match = bodyText.match(/Kelime Kökeni[:\s]+([^.]+\.)/i);
            if (match) {
                origin = match[1].trim();
            }
        }

        if (!origin && !oldestSource) {
            return NextResponse.json({ error: 'No etymology content found' }, { status: 404 });
        }

        const etimolojiData: EtimolojiTRData = {
            origin,
            oldestSource,
            content: origin || oldestSource,
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
