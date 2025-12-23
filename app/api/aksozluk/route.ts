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
        const paragraphs = $('article p').map((_, el) => $(el).html()?.trim()).get();

        // The main etymology content is usually in the paragraphs
        let content = paragraphs.join(' ').trim();

        // Remove date at the beginning (e.g., "10 Mayıs 2020") - handle potential HTML tags before it
        // Turkish month names: Ocak, Şubat, Mart, Nisan, Mayıs, Haziran, Temmuz, Ağustos, Eylül, Ekim, Kasım, Aralık
        // The date pattern might be wrapped in tags or preceded by whitespace/tags.
        content = content.replace(/^(\s*(<[^>]+>\s*)*)\d{1,2}\s+(Ocak|Şubat|Mart|Nisan|Mayıs|Haziran|Temmuz|Ağustos|Eylül|Ekim|Kasım|Aralık)\s+\d{4}\s*/i, '$1');

        // Basic clean up: Remove links but keep text, or just keep formatting. 
        // For now, let's keep simple formatting and strip <a> tags if any, to avoid navigation.
        // Simple regex to strip <a ...> and </a> but keep content
        content = content.replace(/<a\b[^>]*>(.*?)<\/a>/gi, '$1');

        // Strip style attributes from all tags to prevent overriding our CSS
        content = content.replace(/\s*style="[^"]*"/gi, '');
        content = content.replace(/\s*style='[^']*'/gi, '');

        // Remove leading junk that could shift the drop cap:
        // 1. Empty tags (with or without attributes)
        // 2. Spans containing only &nbsp; and whitespace
        // 3. Leading &nbsp; entities
        // 4. &nbsp; inside span tags at the beginning

        // Remove spans that contain only &nbsp; and whitespace (like <span style="...">   </span>)
        content = content.replace(/<span[^>]*>(\s|&nbsp;)*<\/span>/gi, '');

        // Clean &nbsp; from INSIDE opening span tags (e.g., <span style="...">   Akıllı -> <span style="...">Akıllı)
        content = content.replace(/(<span[^>]*>)(\s|&nbsp;)+/gi, '$1');

        // Now clean leading &nbsp; and whitespace repeatedly until stable
        let previousContent = '';
        while (previousContent !== content) {
            previousContent = content;
            content = content.replace(/^(\s|&nbsp;)+/gi, '');
            content = content.replace(/^<span[^>]*>(\s|&nbsp;)*<\/span>/gi, '');
        }
        content = content.trim();

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
