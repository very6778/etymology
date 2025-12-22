import { NextResponse } from 'next/server';

interface TDKData {
    definition?: string;
    etymology?: string;
    example?: string;
    author?: string;
}

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const word = searchParams.get('word');

    if (!word) {
        return NextResponse.json({ error: 'Word parameter is required' }, { status: 400 });
    }

    try {
        // Dynamic import for turkce (CommonJS module)
        const turkceModule = await import('turkce');
        const turkce = turkceModule.default || turkceModule;

        const result = await turkce(word);

        if (!result || !result.kelime) {
            return NextResponse.json({ error: 'Word not found' }, { status: 404 });
        }

        // Map the response to our structure
        const tdkData: TDKData = {
            definition: result.anlamlar?.[0] || '',
            etymology: result.lisan || '',
            example: result.ornekler?.[0]?.ornek || '',
            author: result.ornekler?.[0]?.yazar || '',
        };

        return NextResponse.json({
            source: 'tdk',
            word,
            data: tdkData,
            success: true
        });

    } catch (error) {
        console.error('TDK API error:', error);
        return NextResponse.json(
            { error: 'Failed to fetch data from TDK' },
            { status: 500 }
        );
    }
}
