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
                // Get the next paragraph HTML
                const nextP = $(el).next('p').html()?.trim();
                if (nextP) {
                    origin = nextP;
                }
            }
            if (headerText.includes('Tarihte En Eski Kaynak')) {
                // Get the next paragraph HTML for oldest source
                const nextP = $(el).next('p').html()?.trim();
                if (nextP) {
                    oldestSource = nextP;
                }
            }
        });

        // Fallback: get all paragraphs after h1
        if (!origin) {
            const paragraphs = $('article p, .content p, main p').map((_, el) => $(el).html()?.trim()).get();
            // Join with space and maybe limit length if really needed, but usually we define structure
            origin = paragraphs.filter(p => p && p.length > 20).join(' ').substring(0, 800);
        }

        if (!origin && !oldestSource) {
            // Last resort: get any HTML content but be careful
            // For safety, let's stick to reliable selectors above. If regex is needed on body text, it's brittle for HTML.
            // Let's keep the regex fallback weak or remove if it was only text based.
            // keeping text based fallback as last resort but unlikely to be used if selectors work.
            const bodyText = $('body').text();
            const match = bodyText.match(/Kelime Kökeni[:\s]+([^.]+\.)/i);
            if (match) {
                origin = match[1].trim();
            }
        }

        // Sanitize: Strip <a> tags but keep text
        if (origin) origin = origin.replace(/<a\b[^>]*>(.*?)<\/a>/gi, '$1');
        if (oldestSource) oldestSource = oldestSource.replace(/<a\b[^>]*>(.*?)<\/a>/gi, '$1');

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
