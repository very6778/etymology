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
        // Convert Turkish characters for URL
        const urlWord = turkishToAscii(word);
        const url = `https://aksozluk.org/${urlWord}`;

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

        // The main content is in the article section
        // Find the main text after the h1 title
        const articleText = $('article').text().trim();

        // Extract just the etymology content (skip the title and date)
        const h1Text = $('h1').first().text().trim();

        // Find paragraphs in the article
        const paragraphs = $('article p').map((_, el) => $(el).text().trim()).get();

        // The main etymology content is usually in the paragraphs
        const content = paragraphs.join(' ').trim();

        if (!content || content.length < 10) {
            return NextResponse.json({ error: 'No etymology content found' }, { status: 404 });
        }

        const aksozlukData: AksozlukData = {
            content,
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
